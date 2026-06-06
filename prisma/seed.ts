import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding VendorBridge...");

  // Clear (order matters due to FKs)
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQVendor.deleteMany();
  await prisma.rFQItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();

  const pw = await bcrypt.hash("password123", 10);

  // Vendors
  const acme = await prisma.vendor.create({
    data: { name: "Acme Supplies Pvt Ltd", category: "Office Supplies", gstNumber: "27AABCA1234L1Z5",
      contactName: "Ravi Kumar", email: "vendor@acme.com", phone: "+91 98200 11111",
      address: "Plot 12, MIDC, Pune, MH", status: "ACTIVE", rating: 4.5 },
  });
  const techno = await prisma.vendor.create({
    data: { name: "Techno Hardware Co", category: "IT Hardware", gstNumber: "29AAGCT5678P1Z2",
      contactName: "Sneha Rao", email: "vendor@techno.com", phone: "+91 99000 22222",
      address: "4th Block, Koramangala, Bengaluru, KA", status: "ACTIVE", rating: 4.1 },
  });
  const global = await prisma.vendor.create({
    data: { name: "Global Traders LLP", category: "IT Hardware", gstNumber: "07AAFFG9012Q1Z8",
      contactName: "Amit Sethi", email: "vendor@global.com", phone: "+91 98110 33333",
      address: "Connaught Place, New Delhi, DL", status: "ACTIVE", rating: 3.9 },
  });

  // Users (one per role + vendor logins)
  await prisma.user.create({ data: { name: "System Admin", email: "admin@vendorbridge.com", passwordHash: pw, role: "ADMIN" } });
  const officer = await prisma.user.create({ data: { name: "Priya Procurement", email: "officer@vendorbridge.com", passwordHash: pw, role: "PROCUREMENT_OFFICER" } });
  await prisma.user.create({ data: { name: "Manish Manager", email: "manager@vendorbridge.com", passwordHash: pw, role: "MANAGER" } });
  await prisma.user.create({ data: { name: "Acme Vendor", email: "vendor@acme.com", passwordHash: pw, role: "VENDOR", vendorId: acme.id } });
  await prisma.user.create({ data: { name: "Techno Vendor", email: "vendor@techno.com", passwordHash: pw, role: "VENDOR", vendorId: techno.id } });
  await prisma.user.create({ data: { name: "Global Vendor", email: "vendor@global.com", passwordHash: pw, role: "VENDOR", vendorId: global.id } });

  // Sample RFQ
  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2026-0001",
      title: "Procurement of 50 Office Laptops",
      description: "Business-grade laptops for the new operations team. 16GB RAM, 512GB SSD minimum.",
      department: "Operations",
      category: "IT Hardware",
      budgetAmount: 3200000,
      deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      status: "OPEN",
      createdById: officer.id,
      items: {
        create: [
          { productName: "Business Laptop (16GB/512GB)", description: "i5/Ryzen5, 14-inch", quantity: 50, unit: "pcs" },
          { productName: "Laptop Carry Bag", description: "Padded, water resistant", quantity: 50, unit: "pcs" },
        ],
      },
      invitedVendors: { create: [{ vendorId: techno.id }, { vendorId: global.id }] },
    },
    include: { items: true },
  });

  // Two competing quotations
  const laptop = rfq.items[0];
  const bag = rfq.items[1];

  await prisma.quotation.create({
    data: {
      rfqId: rfq.id, vendorId: techno.id, deliveryDays: 10, notes: "Includes 3-year onsite warranty.",
      status: "SUBMITTED", totalAmount: 50 * 58000 + 50 * 900,
      items: { create: [
        { rfqItemId: laptop.id, unitPrice: 58000, quantity: 50, amount: 50 * 58000 },
        { rfqItemId: bag.id, unitPrice: 900, quantity: 50, amount: 50 * 900 },
      ] },
    },
  });
  await prisma.quotation.create({
    data: {
      rfqId: rfq.id, vendorId: global.id, deliveryDays: 7, notes: "Bulk discount applied.",
      status: "SUBMITTED", totalAmount: 50 * 55500 + 50 * 750,
      items: { create: [
        { rfqItemId: laptop.id, unitPrice: 55500, quantity: 50, amount: 50 * 55500 },
        { rfqItemId: bag.id, unitPrice: 750, quantity: 50, amount: 50 * 750 },
      ] },
    },
  });

  await prisma.activityLog.create({ data: { userId: officer.id, action: "CREATE", entityType: "RFQ", entityId: rfq.id, message: `RFQ ${rfq.rfqNumber} created` } });

  console.log("Seed complete.");
  console.log("\nDemo logins (password: password123):");
  console.log("  admin@vendorbridge.com    (Admin)");
  console.log("  officer@vendorbridge.com  (Procurement Officer)");
  console.log("  manager@vendorbridge.com  (Manager/Approver)");
  console.log("  vendor@techno.com         (Vendor)");
  console.log("  vendor@global.com         (Vendor)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
