import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";

// Demo-grade: always returns ok (no user enumeration). Emails a reset notice.
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (user) {
    await sendMail({
      to: user.email,
      subject: "VendorBridge - Password reset requested",
      text: `Hi ${user.name},\n\nA password reset was requested for your VendorBridge account. ` +
        `In this demo build, please contact your administrator to set a new password.\n\n- VendorBridge`,
    });
  }
  return NextResponse.json({ ok: true, message: "If an account exists, a reset email has been sent." });
}
