import nodemailer from "nodemailer";

export type MailResult = { ok: boolean; mode: "smtp" | "console"; messageId?: string; error?: string };

function hasSmtp() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}): Promise<MailResult> {
  // Graceful fallback: if SMTP isn't configured, log to console so the
  // workflow still works end-to-end during a demo.
  if (!hasSmtp()) {
    console.log("\n========== [EMAIL - console fallback] ==========");
    console.log("To:", opts.to);
    console.log("Subject:", opts.subject);
    console.log(opts.text);
    if (opts.attachments?.length) console.log("Attachments:", opts.attachments.map((a) => a.filename).join(", "));
    console.log("================================================\n");
    return { ok: true, mode: "console" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });
    return { ok: true, mode: "smtp", messageId: info.messageId };
  } catch (e: any) {
    console.error("sendMail error", e);
    return { ok: false, mode: "smtp", error: e?.message || "send failed" };
  }
}
