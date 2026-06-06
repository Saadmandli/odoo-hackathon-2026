import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const vendors = await prisma.vendor.findMany({
      where: {
        AND: [
          q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { gstNumber: { contains: q, mode: "insensitive" } }] } : {},
          status ? { status: status as any } : {},
          category ? { category } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotations: true, purchaseOrders: true } } },
    });
    return NextResponse.json({ vendors });
  } catch (e) { return handle(e); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["ADMIN", "PROCUREMENT_OFFICER"]);
    const body = await req.json();
    if (!body.name || !body.email || !body.category)
      return NextResponse.json({ error: "Name, email and category are required" }, { status: 400 });
    const vendor = await prisma.vendor.create({
      data: {
        name: body.name, email: String(body.email).toLowerCase(), category: body.category,
        gstNumber: body.gstNumber || null, contactName: body.contactName || null,
        phone: body.phone || null, address: body.address || null,
        status: body.status || "ACTIVE", rating: Number(body.rating) || 0,
      },
    });
    await logActivity({ userId: user.id, action: "CREATE", entityType: "Vendor", entityId: vendor.id, message: `Vendor "${vendor.name}" registered` });
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (e) { return handle(e); }
}

function handle(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  if ((e as any)?.code === "P2002") return NextResponse.json({ error: "A vendor with this email already exists" }, { status: 409 });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
