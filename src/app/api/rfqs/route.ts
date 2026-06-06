import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";
import { genNumber } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const where =
      user.role === "VENDOR" && user.vendorId
        ? { invitedVendors: { some: { vendorId: user.vendorId } } }
        : {};
    const rfqs = await prisma.rFQ.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        items: true,
        invitedVendors: { include: { vendor: { select: { name: true } } } },
        _count: { select: { quotations: true } },
      },
    });
    return NextResponse.json({ rfqs });
  } catch (e) { return err(e); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["ADMIN", "PROCUREMENT_OFFICER"]);
    const body = await req.json();
    if (!body.title || !body.deadline || !Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "Title, deadline and at least one item are required" }, { status: 400 });

    const count = await prisma.rFQ.count();
    const rfqNumber = await genNumber("RFQ", count);

    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber, title: body.title, description: body.description || null,
        department: body.department || null, category: body.category || null,
        budgetAmount: body.budgetAmount ? Number(body.budgetAmount) : null,
        deadline: new Date(body.deadline), status: "OPEN", attachment: body.attachment || null,
        createdById: user.id,
        items: { create: body.items.map((it: any) => ({
          productName: it.productName, description: it.description || null,
          quantity: Number(it.quantity) || 1, unit: it.unit || "pcs",
        })) },
        invitedVendors: { create: (body.vendorIds || []).map((id: string) => ({ vendorId: id })) },
      },
      include: { invitedVendors: true },
    });

    await logActivity({ userId: user.id, action: "CREATE", entityType: "RFQ", entityId: rfq.id, message: `RFQ ${rfq.rfqNumber} "${rfq.title}" created` });
    for (const iv of rfq.invitedVendors) {
      const vu = await prisma.user.findFirst({ where: { vendorId: iv.vendorId, role: "VENDOR" } });
      if (vu) await notify(vu.id, "RFQ", `You've been invited to quote on ${rfq.rfqNumber}: ${rfq.title}`, `/rfqs/${rfq.id}`);
    }
    return NextResponse.json({ rfq }, { status: 201 });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
