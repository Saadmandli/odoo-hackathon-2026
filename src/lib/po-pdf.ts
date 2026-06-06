import PDFDocument from "pdfkit";
import { inr, fmtDate } from "./utils";

export type POData = {
  poNumber: string;
  rfqNumber: string;
  rfqTitle: string;
  createdAt: Date | string;
  vendor: { name: string; email: string; gstNumber?: string | null; address?: string | null };
  lines: { name: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  savings: number;
};

export function buildPurchaseOrderPdf(d: POData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const brand = "#4f46e5";

    doc.fillColor(brand).fontSize(24).text("VendorBridge", 50, 50);
    doc.fillColor("#666").fontSize(9).text("Procurement & Vendor Management ERP", 50, 78);
    doc.fillColor("#111").fontSize(20).text("PURCHASE ORDER", 320, 50, { align: "right" });
    doc.fillColor("#666").fontSize(10)
      .text(`PO #: ${d.poNumber}`, 300, 80, { align: "right" })
      .text(`RFQ #: ${d.rfqNumber}`, 300, 95, { align: "right" })
      .text(`Date: ${fmtDate(d.createdAt)}`, 300, 110, { align: "right" });
    doc.moveTo(50, 135).lineTo(545, 135).strokeColor("#ddd").stroke();

    doc.fillColor("#111").fontSize(11).text("Supplier", 50, 150);
    doc.fillColor("#333").fontSize(10).text(d.vendor.name, 50, 168).text(d.vendor.email, 50, 183);
    if (d.vendor.gstNumber) doc.text(`GST: ${d.vendor.gstNumber}`, 50, 198);
    if (d.vendor.address) doc.text(d.vendor.address, 50, 213, { width: 240 });
    doc.fillColor("#111").fontSize(11).text("Reference", 320, 150);
    doc.fillColor("#333").fontSize(10).text(d.rfqTitle, 320, 168, { width: 225 });

    let y = 260;
    doc.rect(50, y, 495, 22).fill(brand);
    doc.fillColor("#fff").fontSize(10)
      .text("Item", 58, y + 6).text("Qty", 330, y + 6, { width: 40, align: "right" })
      .text("Unit Price", 380, y + 6, { width: 70, align: "right" })
      .text("Amount", 460, y + 6, { width: 78, align: "right" });
    y += 22;
    doc.fillColor("#111").fontSize(10);
    d.lines.forEach((l, i) => {
      if (i % 2 === 1) doc.rect(50, y, 495, 20).fill("#f5f5fb");
      doc.fillColor("#111").text(l.name, 58, y + 5, { width: 260 })
        .text(String(l.quantity), 330, y + 5, { width: 40, align: "right" })
        .text(inr(l.unitPrice), 380, y + 5, { width: 70, align: "right" })
        .text(inr(l.amount), 460, y + 5, { width: 78, align: "right" });
      y += 20;
    });
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ddd").stroke();
    y += 12;
    const tx = 360;
    doc.fontSize(10).fillColor("#444");
    doc.text("Subtotal", tx, y, { width: 100, align: "right" }).text(inr(d.subtotal), 460, y, { width: 78, align: "right" });
    y += 18;
    doc.text(`Tax (${d.taxRate}% GST)`, tx, y, { width: 100, align: "right" }).text(inr(d.taxAmount), 460, y, { width: 78, align: "right" });
    y += 22;
    doc.rect(tx, y - 4, 185, 24).fill(brand);
    doc.fillColor("#fff").fontSize(12).text("Total", tx + 5, y + 2, { width: 95, align: "right" }).text(inr(d.totalAmount), 460, y + 2, { width: 78, align: "right" });
    if (d.savings > 0) {
      y += 34;
      doc.fillColor("#059669").fontSize(10).text(`Negotiated savings vs highest bid: ${inr(d.savings)}`, tx - 60, y, { width: 305, align: "right" });
    }
    doc.fillColor("#999").fontSize(8).text("System-generated purchase order from VendorBridge ERP.", 50, 770, { align: "center", width: 495 });
    doc.end();
  });
}
