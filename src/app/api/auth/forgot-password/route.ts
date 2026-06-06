import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (user) {
      await sendMail({
        to: user.email,
        subject: "VendorBridge - Password reset requested",
        text: `Hi ${user.name},\n\nA password reset was requested for your VendorBridge account. ` +
          `In this demo build, please contact your administrator to set a new password.\n\n- VendorBridge`,
      }).catch(() => {});
    }
    return NextResponse.json({ ok: true, message: "If an account exists, a reset email has been sent." });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ ok: true, message: "If an account exists, a reset email has been sent." });
  }
}
