import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    // ADMIN sees global system logs; BUYER and SELLER see only their own activity logs
    const where = user.role === "ADMIN" ? {} : { userId: user.id };

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true, role: true } } },
    });
    return NextResponse.json({ logs });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
