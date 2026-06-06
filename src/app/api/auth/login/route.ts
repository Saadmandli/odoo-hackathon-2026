import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user || !(await verifyPassword(password, user.passwordHash)))
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, vendorId: user.vendorId });
    await logActivity({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, message: `${user.name} logged in` });
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    console.error("login error:", e);
    return NextResponse.json({ error: "Login failed — server error. Is the database running?" }, { status: 500 });
  }
}
