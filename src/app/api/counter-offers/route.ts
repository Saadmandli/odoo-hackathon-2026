import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";

// Create or respond to counter-offers between Buyers and Sellers
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { action } = body;

    // Buyer creates a new counter-offer
    if (action === "CREATE") {
      const { quotationId, targetPrice, targetDays, message } = body;
      if (!quotationId || !targetPrice || !targetDays) {
        return NextResponse.json({ error: "Quotation ID, target price, and delivery timeline are required" }, { status: 400 });
      }

      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { rfq: true, vendor: true },
      });
      if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

      const counter = await prisma.counterOffer.create({
        data: {
          quotationId,
          targetPrice: Number(targetPrice),
          targetDays: Number(targetDays),
          message: message || null,
          createdById: user.id,
          status: "PENDING",
        },
      });

      await logActivity({
        userId: user.id,
        action: "COUNTER_OFFER",
        entityType: "Quotation",
        entityId: quotationId,
        message: `Buyer counter-offer submitted for ${quotation.vendor.name} (Target: ₹${Number(targetPrice).toLocaleString("en-IN")})`,
      });

      // Find seller user account and notify
      const sellerUser = await prisma.user.findFirst({
        where: { vendorId: quotation.vendorId, role: "SELLER" },
      });
      if (sellerUser) {
        await notify(
          sellerUser.id,
          "COUNTER_OFFER",
          `Buyer submitted a counter-offer on ${quotation.rfq.rfqNumber}: Target ₹${Number(targetPrice).toLocaleString("en-IN")}, ${targetDays} days`,
          `/rfqs/${quotation.rfqId}`
        );
      }

      return NextResponse.json({ counter }, { status: 201 });
    }

    // Seller responds to counter-offer (ACCEPT or REJECT)
    if (action === "RESPOND") {
      const { counterId, response } = body; // ACCEPTED or REJECTED
      if (!counterId || !["ACCEPTED", "REJECTED"].includes(response)) {
        return NextResponse.json({ error: "Counter ID and valid response (ACCEPTED/REJECTED) are required" }, { status: 400 });
      }

      const counter = await prisma.counterOffer.findUnique({
        where: { id: counterId },
        include: { quotation: { include: { rfq: true, vendor: true } } },
      });
      if (!counter) return NextResponse.json({ error: "Counter-offer not found" }, { status: 404 });

      const updatedCounter = await prisma.counterOffer.update({
        where: { id: counterId },
        data: { status: response },
      });

      // If accepted by Seller, update quotation's price & delivery days to agreed counter terms
      if (response === "ACCEPTED") {
        await prisma.quotation.update({
          where: { id: counter.quotationId },
          data: {
            totalAmount: counter.targetPrice,
            deliveryDays: counter.targetDays,
          },
        });
      }

      await logActivity({
        userId: user.id,
        action: `COUNTER_${response}`,
        entityType: "Quotation",
        entityId: counter.quotationId,
        message: `Seller ${response.toLowerCase()} counter-offer for ${counter.quotation.rfq.rfqNumber}`,
      });

      // Notify Buyer who created the RFQ
      await notify(
        counter.quotation.rfq.createdById,
        "COUNTER_OFFER",
        `Seller ${response.toLowerCase()} your counter-offer for ${counter.quotation.rfq.rfqNumber} (${counter.quotation.vendor.name})`,
        `/rfqs/${counter.quotation.rfqId}`
      );

      return NextResponse.json({ counter: updatedCounter });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const quotationId = searchParams.get("quotationId");
    if (!quotationId) return NextResponse.json({ error: "quotationId required" }, { status: 400 });

    const counterOffers = await prisma.counterOffer.findMany({
      where: { quotationId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true, role: true } } },
    });
    return NextResponse.json({ counterOffers });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
