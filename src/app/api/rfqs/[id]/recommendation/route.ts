import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { scoreQuotations } from "@/lib/scoring";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser(["BUYER", "ADMIN"]);
    const quotes = await prisma.quotation.findMany({
      where: { rfqId: params.id, status: { in: ["SUBMITTED", "SELECTED"] } },
      include: { vendor: true },
    });
    const rec = scoreQuotations(quotes.map((q) => ({
      quotationId: q.id, vendorName: q.vendor.name, vendorRating: q.vendor.rating,
      vendorStatus: q.vendor.status, totalAmount: q.totalAmount, deliveryDays: q.deliveryDays,
    })));
    return NextResponse.json(rec);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
