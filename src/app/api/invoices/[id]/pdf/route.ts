import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/rbac";
import { loadInvoiceData } from "@/lib/invoice-data";
import { buildInvoicePdf } from "@/lib/pdf";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const data = await loadInvoiceData(params.id);
    if (!data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const pdf = await buildInvoicePdf(data);
    const { searchParams } = new URL(req.url);
    const inline = searchParams.get("inline") === "1";
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${data.invoiceNumber}.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
