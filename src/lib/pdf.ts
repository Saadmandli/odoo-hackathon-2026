import PDFDocument from "pdfkit";
import { inr, fmtDate } from "./utils";

export type InvoiceData = {
  invoiceNumber: string;
  poNumber: string;
  rfqTitle: string;
  createdAt: Date | string;
  vendor: { name: string; email: string; gstNumber?: string | null; address?: string | null };
  lines: { name: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
};

export function buildInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const brand = "#4f46e5";
    // Header
    doc.fillColor(brand).fontSize(24).text("VendorBridge", 50, 50);
    doc.fillColor("#666").fontSize(9).text("Procurement & Vendor Management ERP", 50, 78);
    doc.fillColor("#111").fontSize(20).text("INVOICE", 400, 50, { align: "right" });
    doc.fillColor("#666").fontSize(10)
      .text(`Invoice #: ${data.invoiceNumber}`, 300, 80, { align: "right" })
      .text(`PO #: ${data.poNumber}`, 300, 95, { align: "right" })
      .text(`Date: ${fmtDate(data.createdAt)}`, 300, 110, { align: "right" });

    doc.moveTo(50, 135).lineTo(545, 135).strokeColor("#ddd").stroke();

    // Vendor block
    doc.fillColor("#111").fontSize(11).text("Billed To / Vendor", 50, 150);
    doc.fillColor("#333").fontSize(10)
      .text(data.vendor.name, 50, 168)
      .text(data.vendor.email, 50, 183);
    if (data.vendor.gstNumber) doc.text(`GST: ${data.vendor.gstNumber}`, 50, 198);
    if (data.vendor.address) doc.text(data.vendor.address, 50, 213, { width: 240 });

    doc.fillColor("#111").fontSize(11).text("Reference", 320, 150);
    doc.fillColor("#333").fontSize(10).text(data.rfqTitle, 320, 168, { width: 225 });

    // Table header
    let y = 260;
    doc.rect(50, y, 495, 22).fill(brand);
    doc.fillColor("#fff").fontSize(10)
      .text("Item", 58, y + 6)
      .text("Qty", 330, y + 6, { width: 40, align: "right" })
      .text("Unit Price", 380, y + 6, { width: 70, align: "right" })
      .text("Amount", 460, y + 6, { width: 78, align: "right" });
    y += 22;

    // Rows
    doc.fillColor("#111").fontSize(10);
    data.lines.forEach((l, i) => {
      if (i % 2 === 1) doc.rect(50, y, 495, 20).fill("#f5f5fb").fillColor("#111");
      doc.fillColor("#111")
        .text(l.name, 58, y + 5, { width: 260 })
        .text(String(l.quantity), 330, y + 5, { width: 40, align: "right" })
        .text(inr(l.unitPrice), 380, y + 5, { width: 70, align: "right" })
        .text(inr(l.amount), 460, y + 5, { width: 78, align: "right" });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ddd").stroke();
    y += 12;

    // Totals
    const totalsX = 360;
    doc.fontSize(10).fillColor("#444");
    doc.text("Subtotal", totalsX, y, { width: 100, align: "right" }).text(inr(data.subtotal), 460, y, { width: 78, align: "right" });
    y += 18;
    doc.text(`Tax (${data.taxRate}% GST)`, totalsX, y, { width: 100, align: "right" }).text(inr(data.taxAmount), 460, y, { width: 78, align: "right" });
    y += 22;
    doc.rect(totalsX, y - 4, 185, 24).fill(brand);
    doc.fillColor("#fff").fontSize(12)
      .text("Total", totalsX + 5, y + 2, { width: 95, align: "right" })
      .text(inr(data.totalAmount), 460, y + 2, { width: 78, align: "right" });

    // Footer
    doc.fillColor("#999").fontSize(8).text(
      "This is a system-generated invoice from VendorBridge ERP. Thank you for your business.",
      50, 760, { align: "center", width: 495 }
    );

    doc.end();
  });
}
