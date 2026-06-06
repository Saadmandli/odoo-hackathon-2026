import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);
const monthAnchor = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 14);

async function main() {
  console.log("Seeding VendorBridge with full demo dataset…");

  // Clear (FK-safe order)
  for (const m of ["goodsReceiptItem","goodsReceipt","notification","activityLog","invoice","purchaseOrder","approval","quotationItem","quotation","rFQVendor","rFQItem","rFQ","user","vendor"]) {
    // @ts-ignore
    await prisma[m].deleteMany();
  }
  const pw = await bcrypt.hash("password123", 10);

  // ---------- Vendors (5) ----------
  const acme = await prisma.vendor.create({ data: { name: "Acme Supplies Pvt Ltd", category: "Office Supplies", gstNumber: "27AABCA1234L1Z5", contactName: "Ravi Kumar", email: "vendor@acme.com", phone: "+91 98200 11111", address: "Plot 12, MIDC, Pune, MH", status: "ACTIVE", rating: 4.5 } });
  const techno = await prisma.vendor.create({ data: { name: "Techno Hardware Co", category: "IT Hardware", gstNumber: "29AAGCT5678P1Z2", contactName: "Sneha Rao", email: "vendor@techno.com", phone: "+91 99000 22222", address: "Koramangala, Bengaluru, KA", status: "ACTIVE", rating: 4.2 } });
  const global = await prisma.vendor.create({ data: { name: "Global Traders LLP", category: "IT Hardware", gstNumber: "07AAFFG9012Q1Z8", contactName: "Amit Sethi", email: "vendor@global.com", phone: "+91 98110 33333", address: "Connaught Place, New Delhi, DL", status: "ACTIVE", rating: 3.9 } });
  const prime = await prisma.vendor.create({ data: { name: "Prime Furnishings", category: "Furniture", gstNumber: "24AACFP3344R1Z9", contactName: "Neha Shah", email: "vendor@prime.com", phone: "+91 99888 44444", address: "Ashram Road, Ahmedabad, GJ", status: "ACTIVE", rating: 4.0 } });
  const swift = await prisma.vendor.create({ data: { name: "Swift Logistics", category: "Services", gstNumber: "33AAECS7788T1Z4", contactName: "Karthik Iyer", email: "vendor@swift.com", phone: "+91 90000 55555", address: "Anna Salai, Chennai, TN", status: "PENDING", rating: 3.6 } });

  // ---------- Users ----------
  await prisma.user.create({ data: { name: "System Admin", email: "admin@vendorbridge.com", passwordHash: pw, role: "ADMIN" } });
  const officer = await prisma.user.create({ data: { name: "Priya Procurement", email: "officer@vendorbridge.com", passwordHash: pw, role: "PROCUREMENT_OFFICER" } });
  const manager = await prisma.user.create({ data: { name: "Manish Manager", email: "manager@vendorbridge.com", passwordHash: pw, role: "MANAGER" } });
  await prisma.user.create({ data: { name: "Acme Vendor", email: "vendor@acme.com", passwordHash: pw, role: "VENDOR", vendorId: acme.id } });
  await prisma.user.create({ data: { name: "Techno Vendor", email: "vendor@techno.com", passwordHash: pw, role: "VENDOR", vendorId: techno.id } });
  await prisma.user.create({ data: { name: "Global Vendor", email: "vendor@global.com", passwordHash: pw, role: "VENDOR", vendorId: global.id } });
  await prisma.user.create({ data: { name: "Prime Vendor", email: "vendor@prime.com", passwordHash: pw, role: "VENDOR", vendorId: prime.id } });

  const _logs: any[] = [];
  const _notifs: any[] = [];
  const log = async (action: string, entityType: string, message: string, when: Date, userId = officer.id) => { _logs.push({ userId, action, entityType, message, createdAt: when }); };
  const notify = async (userId: string, type: string, message: string, link?: string) => { _notifs.push({ userId, type, message, link }); };

  let rfqN = 0, poN = 0, invN = 0, grnN = 0;
  const num = (p: string, n: number) => `${p}-2026-${String(n).padStart(4, "0")}`;

  // Helper that runs an RFQ fully or partially through the pipeline.
  async function makeRFQ(opts: {
    title: string; category: string; department: string; budget: number; createdAt: Date;
    items: { productName: string; quantity: number; unit?: string }[];
    invited: string[];
    quotes: { vendorId: string; prices: number[]; deliveryDays: number; notes?: string }[];
  }) {
    rfqN++;
    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber: num("RFQ", rfqN), title: opts.title, description: `${opts.title} for the ${opts.department} department.`,
        department: opts.department, category: opts.category, budgetAmount: opts.budget,
        deadline: new Date(opts.createdAt.getTime() + 7 * 24 * 3600 * 1000), status: "OPEN",
        createdById: officer.id, createdAt: opts.createdAt,
        items: { create: opts.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unit: i.unit || "pcs" })) },
        invitedVendors: { create: opts.invited.map((v) => ({ vendorId: v })) },
      },
      include: { items: true },
    });
    await log("CREATE", "RFQ", `RFQ ${rfq.rfqNumber} "${rfq.title}" created`, opts.createdAt);

    const quotations = [];
    for (const q of opts.quotes) {
      const lineData = rfq.items.map((it, idx) => ({ rfqItemId: it.id, unitPrice: q.prices[idx], quantity: it.quantity, amount: q.prices[idx] * it.quantity }));
      const total = lineData.reduce((s, l) => s + l.amount, 0);
      const quote = await prisma.quotation.create({
        data: { rfqId: rfq.id, vendorId: q.vendorId, deliveryDays: q.deliveryDays, notes: q.notes || null, status: "SUBMITTED", totalAmount: total, createdAt: new Date(opts.createdAt.getTime() + 24 * 3600 * 1000), items: { create: lineData } },
        include: { vendor: true },
      });
      quotations.push(quote);
      await notify(officer.id, "QUOTATION", `${quote.vendor.name} submitted a quotation for ${rfq.rfqNumber}`, `/rfqs/${rfq.id}`);
    }
    return { rfq, quotations };
  }

  async function award(rfq: any, quote: any, opts: { auto: boolean; tier: string; goods: "complete" | "partial" | "none"; invoice: boolean; sent?: boolean; awardedAt: Date }) {
    const others = await prisma.quotation.findMany({ where: { rfqId: rfq.id } });
    const highest = Math.max(...others.map((q) => q.totalAmount));
    await prisma.quotation.update({ where: { id: quote.id }, data: { status: "SELECTED" } });
    const approval = await prisma.approval.create({
      data: { rfqId: rfq.id, quotationId: quote.id, status: "APPROVED", autoApproved: opts.auto, tier: opts.tier, approverId: opts.auto ? null : manager.id, decidedAt: opts.awardedAt, remarks: opts.auto ? "Auto-approved: within delegated spend limit" : "Approved — best overall value." },
    });
    await prisma.rFQ.update({ where: { id: rfq.id }, data: { status: "AWARDED" } });
    await log(opts.auto ? "AUTO_APPROVE" : "APPROVED", "Approval", `${quote.vendor.name}'s quote on ${rfq.rfqNumber} ${opts.auto ? "auto-approved" : "approved"} (${opts.tier})`, opts.awardedAt, opts.auto ? officer.id : manager.id);

    const subtotal = quote.totalAmount;
    const taxAmount = +(subtotal * 0.18).toFixed(2);
    const savings = +Math.max(0, highest - subtotal).toFixed(2);
    const budgetSaving = +Math.max(0, rfq.budgetAmount - subtotal).toFixed(2);
    poN++;
    const po = await prisma.purchaseOrder.create({
      data: { poNumber: num("PO", poN), quotationId: quote.id, vendorId: quote.vendorId, subtotal, taxRate: 18, taxAmount, totalAmount: +(subtotal + taxAmount).toFixed(2), savings, budgetSaving, status: "ISSUED", createdAt: opts.awardedAt },
      include: { quotation: { include: { items: true } } },
    });
    await log("CREATE", "PurchaseOrder", `PO ${po.poNumber} issued to ${quote.vendor.name} (saved ₹${savings.toLocaleString("en-IN")})`, opts.awardedAt);

    let grn = null;
    if (opts.goods !== "none") {
      grnN++;
      const items = po.quotation.items.map((it) => ({ rfqItemId: it.rfqItemId, orderedQty: it.quantity, receivedQty: opts.goods === "complete" ? it.quantity : Math.max(1, Math.floor(it.quantity * 0.8)) }));
      const complete = opts.goods === "complete";
      grn = await prisma.goodsReceipt.create({ data: { grnNumber: num("GRN", grnN), purchaseOrderId: po.id, receivedById: officer.id, status: complete ? "COMPLETE" : "PARTIAL", notes: complete ? "All items received in good condition." : "Partial delivery; balance pending.", createdAt: new Date(opts.awardedAt.getTime() + 3 * 24 * 3600 * 1000), items: { create: items } } });
      await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: complete ? "RECEIVED" : "ACKNOWLEDGED" } });
      await log("RECEIVE", "GoodsReceipt", `Goods received (${grn.grnNumber}) for ${po.poNumber} — ${complete ? "complete" : "partial"}`, grn.createdAt);
    }

    if (opts.invoice) {
      invN++;
      const fullyReceived = grn ? opts.goods === "complete" : false;
      const matchStatus = !grn ? "PENDING" : fullyReceived ? "MATCHED" : "MISMATCH";
      const inv = await prisma.invoice.create({
        data: { invoiceNumber: num("INV", invN), purchaseOrderId: po.id, subtotal: po.subtotal, taxRate: 18, taxAmount: po.taxAmount, totalAmount: po.totalAmount, status: opts.sent ? "SENT" : "DRAFT", matchStatus: matchStatus as any, sentAt: opts.sent ? new Date(opts.awardedAt.getTime() + 4 * 24 * 3600 * 1000) : null, createdAt: new Date(opts.awardedAt.getTime() + 4 * 24 * 3600 * 1000) },
      });
      await log("CREATE", "Invoice", `Invoice ${inv.invoiceNumber} generated for ${po.poNumber} (match: ${matchStatus})`, inv.createdAt);
      if (opts.sent) await log("EMAIL", "Invoice", `Invoice ${inv.invoiceNumber} emailed to ${quote.vendor.email}`, inv.sentAt!);
    }
    return po;
  }

  // ---------- RFQ 1: Laptops — fully completed, MATCHED invoice (2 months ago) ----------
  const r1 = await makeRFQ({ title: "Procurement of 50 Office Laptops", category: "IT Hardware", department: "Operations", budget: 3200000, createdAt: monthAnchor(2),
    items: [{ productName: "Business Laptop (16GB/512GB)", quantity: 50 }, { productName: "Laptop Carry Bag", quantity: 50 }],
    invited: [techno.id, global.id, acme.id],
    quotes: [
      { vendorId: techno.id, prices: [58000, 900], deliveryDays: 10, notes: "3-year onsite warranty included." },
      { vendorId: global.id, prices: [55500, 750], deliveryDays: 7, notes: "Bulk discount applied." },
      { vendorId: acme.id, prices: [60000, 1000], deliveryDays: 14, notes: "Premium models." },
    ] });
  await award(r1.rfq, r1.quotations[1], { auto: false, tier: "Admin sign-off", goods: "complete", invoice: true, sent: true, awardedAt: monthAnchor(2) });

  // ---------- RFQ 2: Office Chairs — partial goods, MISMATCH invoice (1 month ago) ----------
  const r2 = await makeRFQ({ title: "100 Ergonomic Office Chairs", category: "Furniture", department: "Admin", budget: 600000, createdAt: monthAnchor(1),
    items: [{ productName: "Ergonomic Mesh Chair", quantity: 100 }],
    invited: [prime.id, acme.id],
    quotes: [
      { vendorId: prime.id, prices: [4500], deliveryDays: 12, notes: "Adjustable lumbar support." },
      { vendorId: acme.id, prices: [5200], deliveryDays: 9, notes: "Includes assembly." },
    ] });
  await award(r2.rfq, r2.quotations[0], { auto: false, tier: "Manager approval", goods: "partial", invoice: true, sent: false, awardedAt: monthAnchor(1) });

  // ---------- RFQ 3: Printer Cartridges — small, AUTO-APPROVED, invoice PENDING (no goods yet) (this month) ----------
  const r3 = await makeRFQ({ title: "Printer Cartridge Restock", category: "Office Supplies", department: "IT", budget: 80000, createdAt: daysAgo(10),
    items: [{ productName: "Toner Cartridge (Black)", quantity: 100 }],
    invited: [acme.id],
    quotes: [{ vendorId: acme.id, prices: [700], deliveryDays: 4, notes: "Genuine OEM cartridges." }] });
  await award(r3.rfq, r3.quotations[0], { auto: true, tier: "Auto-approved", goods: "none", invoice: true, sent: false, awardedAt: daysAgo(9) });

  // ---------- RFQ 4: Stationery — OPEN with quotes (live Smart Award demo, awaiting selection) ----------
  await makeRFQ({ title: "Annual Stationery Supply", category: "Office Supplies", department: "Admin", budget: 200000, createdAt: daysAgo(3),
    items: [{ productName: "A4 Paper (ream)", quantity: 500 }, { productName: "Assorted Pens (box)", quantity: 200 }],
    invited: [acme.id, prime.id],
    quotes: [
      { vendorId: acme.id, prices: [240, 180], deliveryDays: 5, notes: "Eco-friendly paper." },
      { vendorId: prime.id, prices: [255, 165], deliveryDays: 8, notes: "Premium stationery." },
    ] });

  // ---------- RFQ 5: AV Setup — OPEN, selected, PENDING approval (Approvals page demo) ----------
  const r5 = await makeRFQ({ title: "Conference Room AV Setup", category: "IT Hardware", department: "Facilities", budget: 400000, createdAt: daysAgo(2),
    items: [{ productName: "4K Projector", quantity: 2 }, { productName: "Conference Speakerphone", quantity: 4 }],
    invited: [techno.id, swift.id],
    quotes: [{ vendorId: techno.id, prices: [95000, 12000], deliveryDays: 15, notes: "Installation included." }] });
  // Officer selected Techno's quote -> pending Manager/Admin approval (₹2.38L)
  await prisma.quotation.update({ where: { id: r5.quotations[0].id }, data: { status: "SELECTED" } });
  await prisma.approval.create({ data: { rfqId: r5.rfq.id, quotationId: r5.quotations[0].id, status: "PENDING", tier: "Manager approval", createdAt: daysAgo(1) } });
  await log("REQUEST_APPROVAL", "Approval", `Approval requested (Manager approval) for Techno Hardware Co's quote on ${r5.rfq.rfqNumber}`, daysAgo(1));
  await notify(manager.id, "APPROVAL", `Manager approval needed: ${r5.rfq.rfqNumber} — Techno Hardware Co`, "/approvals");

  // A few extra notifications for the bell
  await notify(officer.id, "PO", "Purchase order PO-2026-0001 fulfilled by Global Traders", "/purchase-orders");
  await notify(officer.id, "APPROVAL", "Quotation approved for RFQ-2026-0002", "/rfqs");

  await prisma.activityLog.createMany({ data: _logs });
  await prisma.notification.createMany({ data: _notifs });

  const counts = {
    vendors: await prisma.vendor.count(), users: await prisma.user.count(), rfqs: await prisma.rFQ.count(),
    quotations: await prisma.quotation.count(), approvals: await prisma.approval.count(),
    purchaseOrders: await prisma.purchaseOrder.count(), goodsReceipts: await prisma.goodsReceipt.count(),
    invoices: await prisma.invoice.count(), activity: await prisma.activityLog.count(), notifications: await prisma.notification.count(),
  };
  console.log("Seed complete:", counts);
  console.log("\nLogins (password: password123): admin@ / officer@ / manager@ / vendor@techno.com / vendor@global.com / vendor@acme.com / vendor@prime.com  (all @vendorbridge.com for staff)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
