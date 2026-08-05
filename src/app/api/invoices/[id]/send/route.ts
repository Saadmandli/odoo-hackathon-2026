import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { loadInvoiceData } from "@/lib/invoice-data";
import { buildInvoicePdf } from "@/lib/pdf";
import { sendMail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { inr } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["BUYER", "ADMIN"]);
    const data = await loadInvoiceData(params.id);
    if (!data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    let to = data.vendor.email;
    try { const body = await req.json(); if (body?.to) to = body.to; } catch {}

    const pdf = await buildInvoicePdf(data);
    const result = await sendMail({
      to,
      subject: `Invoice ${data.invoiceNumber} from VendorBridge`,
      text: `Dear ${data.vendor.name},\n\nPlease find attached invoice ${data.invoiceNumber} (PO ${data.poNumber}) for "${data.rfqTitle}".\n\nTotal due: ${inr(data.totalAmount)}\n\nRegards,\nVendorBridge Procurement`,
      html: `<p>Dear ${data.vendor.name},</p><p>Please find attached invoice <b>${data.invoiceNumber}</b> (PO ${data.poNumber}) for "<i>${data.rfqTitle}</i>".</p><p>Total due: <b>${inr(data.totalAmount)}</b></p><p>Regards,<br/>VendorBridge Procurement</p>`,
      attachments: [{ filename: `${data.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }],
    });

    if (!result.ok) return NextResponse.json({ error: result.error || "Failed to send" }, { status: 502 });

    await prisma.invoice.update({ where: { id: params.id }, data: { status: "SENT", sentAt: new Date() } });
    await logActivity({ userId: user.id, action: "EMAIL", entityType: "Invoice", entityId: params.id, message: `Invoice ${data.invoiceNumber} emailed to ${to}` });
    return NextResponse.json({ ok: true, mode: result.mode, to });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
