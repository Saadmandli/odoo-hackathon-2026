# VendorBridge — Procurement & Vendor Management ERP

A production-grade ERP that digitizes the entire procurement lifecycle — vendors, RFQs, quotations, approvals, purchase orders, goods receipts, and invoices — with a **Procurement Intelligence** layer most teams won't build: an explainable Smart Award engine, automated approval routing, realized-savings tracking, and 3-way invoice matching.

Built with **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind CSS**.

---

## ⭐ Standout features (what sets VendorBridge apart)

**1. Smart Award Engine (explainable AI-style scoring).**
Every quotation is scored 0–100 on a transparent weighted model — Price 45%, Delivery 25%, Vendor rating 20%, Reliability 10% — normalized across the competing bids. The system ranks vendors, recommends a winner, and **explains why in plain English** ("Lowest total price", "Fastest delivery", "Beats next-best by 12.4 points"). It's not just "lowest price wins" — it's defensible, data-driven sourcing.

**2. Realized savings tracking.**
Set a budget per RFQ. When a PO is awarded, VendorBridge computes savings two ways — versus the highest competing bid and versus budget — and rolls them up into a live "Total Savings" metric on the dashboard and reports. A concrete "we saved ₹X" number is the headline of any procurement demo.

**3. Threshold-based approval routing (delegation of authority).**
Small spend (≤ ₹1,00,000) **auto-approves** instantly; mid-size routes to a Manager; large spend escalates to Admin sign-off — automatically, with the tier recorded on the approval timeline. Mirrors how real enterprises control spend.

**4. Goods Receipt + automatic 3-way match.**
Receive goods against a PO (full or partial), and the invoice only clears when **PO = Goods Received = Invoice**. Invoices show a live match badge (Awaiting goods / ✓ Matched / Mismatch) — the classic ERP control that prevents paying for undelivered goods.

**5. Vendor scorecards.**
Each vendor gets an auto-computed performance grade (A–D) from rating, win rate, fulfillment rate, and spend — and that performance feeds back into the Smart Award engine.

**6. Documents & exports.** Real PDF **invoices and purchase orders** (download / print / email), plus one-click **CSV export** of the full procurement report.

---

## Quick start

### Easiest — zero setup (only Node.js needed)

No database to install, no Docker. The app runs its own PostgreSQL automatically.

- **Windows:** double-click **`run.bat`**
- **macOS / Linux:** `./run.sh`
- **or any OS:**
  ```bash
  npm install
  npm run dev:local      # starts an embedded database + the app
  ```

Open (https://odoo-hackathon-2026-ruby.vercel.app). (First run downloads a small Postgres binary and seeds demo data.)

### Alternative — use your own PostgreSQL

```bash
npm install
docker compose up -d            # or point DATABASE_URL at any PostgreSQL
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev                     # http://localhost:3000
```

### Demo accounts (password: `password123`)

| Email | Role |
|-------|------|
| `admin@vendorbridge.com` | Admin |
| `officer@vendorbridge.com` | Procurement Officer |
| `manager@vendorbridge.com` | Manager / Approver |
| `vendor@techno.com` / `vendor@global.com` | Vendor |

The login screen has one-click buttons. The seed includes a sample RFQ (with a ₹32,00,000 budget) and two competing quotations, so the Smart Award recommendation and savings show immediately.

---

## 2-minute winning demo

1. **Officer** opens RFQ `RFQ-2026-0001` → the **Smart Award** banner already recommends a vendor with reasons and projected savings.
2. Click **Select & approve** on the recommended quote → it's ₹28L so it routes to approval (small orders would auto-approve).
3. **Manager** → Approvals → **Approve**.
4. **Officer** → **Generate PO** (savings recorded) → **Generate Invoice** (shows *Awaiting goods*).
5. **Purchase Orders** → **Receive** goods → invoice flips to **✓ Matched** (3-way match).
6. **Invoices** → **Download / Print / Email** the PDF. **Reports** → see Total Savings, charts, vendor scorecards, **Export CSV**.

---

## Architecture

```
src/
├── middleware.ts              # Edge auth guard on every route
├── app/
│   ├── (app)/                 # Authenticated shell (sidebar, topbar, notifications)
│   │   ├── dashboard, vendors, rfqs, rfqs/[id], approvals,
│   │   ├── purchase-orders, goods-receipts, invoices, reports, activity
│   ├── login / signup / forgot-password
│   └── api/                   # 24 route handlers
├── lib/
│   ├── scoring.ts             # ⭐ Smart Award engine (explainable weighted scoring)
│   ├── approval-policy.ts     # ⭐ Threshold-based approval routing
│   ├── scorecard.ts           # ⭐ Vendor performance grading
│   ├── match.ts               # ⭐ 3-way match (PO · Goods · Invoice)
│   ├── pdf.ts / po-pdf.ts     # Invoice & PO PDF generation (pdfkit)
│   ├── csv.ts                 # Report export
│   ├── auth.ts / rbac.ts      # JWT sessions + role authorization
│   ├── email.ts               # nodemailer (console fallback if no SMTP)
│   └── prisma.ts / activity.ts / utils.ts / invoice-data.ts
└── components/                # Sidebar, NotificationBell, Badge, PageHeader
prisma/
├── schema.prisma             # 14 models, 9 enums, full relational integrity
└── seed.ts                   # Demo users (all roles), vendors, RFQ + quotations + budget
```

**Data model:** User, Vendor, RFQ, RFQItem, RFQVendor, Quotation, QuotationItem, Approval, PurchaseOrder, GoodsReceipt, GoodsReceiptItem, Invoice, ActivityLog, Notification — with cascading deletes, compound-unique constraints, and computed savings/match state.

**Security:** httpOnly + SameSite JWT cookies, bcrypt password hashing, server-side role checks on every mutating endpoint, and strict tenant scoping — vendors can only view/quote RFQs they were invited to and only see their own data.

---

## Scripts

```bash
npm run dev        # Dev server
npm run build      # Production build (prisma generate + next build)
npm run start      # Production server
npm run db:push    # Sync schema to database
npm run db:seed    # Load demo data
npm run db:studio  # Visual database browser
```

## Environment (`.env`)

```ini
DATABASE_URL="postgresql://vendorbridge:vendorbridge@localhost:5432/vendorbridge?schema=public"
JWT_SECRET="a-long-random-secret-at-least-32-chars"
# Optional SMTP — without it, "email invoice" logs to the server console.
SMTP_HOST=  SMTP_PORT=587  SMTP_USER=  SMTP_PASS=  SMTP_FROM=
```
