import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import type { Role } from "@prisma/client";

const ALLOWED: Role[] = ["PROCUREMENT_OFFICER", "MANAGER", "VENDOR", "ADMIN"];

export async function POST(req: Request) {
  try {
    const { name, email, password, role, vendorName, category } = await req.json().catch(() => ({}));
    if (!name || !email || !password)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    if (String(password).length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const lcEmail = String(email).toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lcEmail } });
    if (exists) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const finalRole: Role = ALLOWED.includes(role) ? role : "PROCUREMENT_OFFICER";
    const passwordHash = await hashPassword(password);

    let vendorId: string | undefined;
    if (finalRole === "VENDOR") {
      const vendor = await prisma.vendor.create({
        data: { name: vendorName || name, category: category || "General", email: lcEmail, status: "PENDING" },
      });
      vendorId = vendor.id;
    }

    const user = await prisma.user.create({ data: { name, email: lcEmail, passwordHash, role: finalRole, vendorId } });
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, vendorId: user.vendorId });
    await logActivity({ userId: user.id, action: "SIGNUP", entityType: "User", entityId: user.id, message: `${user.name} signed up as ${user.role}` });
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    console.error("signup error:", e);
    return NextResponse.json({ error: "Signup failed — server error. Is the database running?" }, { status: 500 });
  }
}
