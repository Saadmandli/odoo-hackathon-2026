# VendorBridge — Everything You Need to Know (One File)

**Read this file only.** It explains what the project is, how to run it, how to demo it, and how to answer questions — even if you know nothing about code.

---

## 1. What is this project? (30-second pitch)

**VendorBridge** is a **Procurement & Vendor Management ERP** — a web app that helps companies **buy things from suppliers** in an organized, paperless way.

Instead of emailing suppliers and using Excel, a company can:

1. Ask suppliers for prices (RFQ)
2. Compare quotes and pick the best one (Smart Award)
3. Get manager approval for big purchases
4. Create an official order (Purchase Order)
5. Record when goods arrive (Goods Receipt)
6. Generate and send invoices
7. Track savings and vendor performance in reports

**Real-world example:** A company needs 50 laptops. They post a request → suppliers reply with prices → the system recommends the best deal → a manager approves → an order is created → laptops arrive → invoice is paid. All in one app.

**Built with:** Next.js 14, TypeScript, PostgreSQL, Prisma, Tailwind CSS.

---

## 2. How to run it on your computer

### Requirements
- **Node.js** (LTS) from https://nodejs.org — that's it for the easy path.

### Easiest way (Windows)
1. Open the `vendorbridge` folder
2. Double-click **`run.bat`**
3. Wait 1–2 minutes (first time installs dependencies + database)
4. Open **http://localhost:3000**

### Or use the terminal
```bash
cd vendorbridge
npm install
npm run dev:local
```
Then open **http://localhost:3000**.

**What `dev:local` does:** Starts its own small PostgreSQL database automatically (no Docker needed), loads demo data, and starts the website.

### Stop the app
Press **Ctrl + C** in the terminal window.

### Reload demo data (if screens look empty)
```bash
npm run db:reseed
```
Then refresh the browser.

---

## 3. Login accounts (password for ALL: `password123`)

The login page has **one-click demo buttons**. Or type these manually:

| Email | Role | Best for demo |
|-------|------|---------------|
| `officer@vendorbridge.com` | Procurement Officer (buyer) | **Start here** — creates RFQs, picks winners, POs, invoices |
| `manager@vendorbridge.com` | Manager / Approver | Approving/rejecting purchases |
| `admin@vendorbridge.com` | Admin | Full access + big approvals + reports |
| `vendor@techno.com` | Vendor (supplier) | Submitting quotes, viewing own orders |
| `vendor@global.com` | Vendor | Same as above |
| `vendor@acme.com` | Vendor | Same as above |
| `vendor@prime.com` | Vendor | Same as above |
| `vendor@greenpack.com` | Vendor | Same as above |

---

## 4. Every page in the app

| Page | URL | What it shows |
|------|-----|---------------|
| **Login** | `/login` | Sign in + demo buttons |
| **Signup** | `/signup` | Create new account |
| **Dashboard** | `/dashboard` | Overview: active RFQs, pending approvals, total spend, savings, recent POs & invoices |
| **Vendors** | `/vendors` | Supplier list — name, category, GST, rating, status. Add/edit/search |
| **RFQs** | `/rfqs` | All purchase requests (Requests for Quotation) |
| **New RFQ** | `/rfqs/new` | Create a new purchase request |
| **RFQ Detail** | `/rfqs/[id]` | **Most important page** — quotes, Smart Award, select winner |
| **Approvals** | `/approvals` | Manager approves/rejects pending purchases |
| **Purchase Orders** | `/purchase-orders` | Official orders + PDF download + Receive goods |
| **Goods Receipts** | `/goods-receipts` | Record of delivered items |
| **Invoices** | `/invoices` | Bills + 3-way match status + PDF/email |
| **Reports** | `/reports` | Charts, savings, vendor scorecards, CSV export |
| **Activity** | `/activity` | Audit log + notifications |

---

## 5. The 4 user roles

| Role | Who | Can do |
|------|-----|--------|
| **Procurement Officer** | Company buyer | Create RFQs, compare quotes, select winners, create POs & invoices |
| **Vendor** | Supplier | See invited RFQs only, submit quotes, view own POs/invoices |
| **Manager** | Boss | Approve/reject medium-size purchases |
| **Admin** | Owner/IT | Everything + large purchase sign-off |

**Security:** A vendor can NEVER see another vendor's prices. This is enforced by the server, not just the UI.

---

## 6. Key business words (memorize these)

| Term | Meaning |
|------|---------|
| **RFQ** | Request for Quotation — "Please send me your price for these items" |
| **Quotation / Quote** | Supplier's reply with prices and delivery time |
| **Approval** | Manager saying "yes, we can spend this money" |
| **PO (Purchase Order)** | Official order document sent to the winning supplier |
| **GRN (Goods Receipt)** | Proof that items actually arrived |
| **Invoice** | The bill to pay |
| **GST** | Indian tax (18% in this app) |
| **3-Way Match** | Checking that PO = Goods Received = Invoice all agree before paying |

---

## 7. The complete workflow (step by step)

```
Officer creates RFQ → invites suppliers
        ↓
Suppliers submit price quotes
        ↓
Smart Award ranks quotes & recommends a winner
        ↓
Officer selects the winner → approval requested
        ↓
Manager approves (OR small orders auto-approve instantly)
        ↓
Purchase Order is generated (savings recorded)
        ↓
Goods arrive → Officer records Goods Receipt
        ↓
Invoice is generated → 3-way match checks everything
        ↓
Invoice downloaded / emailed → shows in Reports
```

---

## 8. The 6 "smart" features (what makes it special)

These are the features that impress judges / interviewers. Basic apps just have forms — VendorBridge has **intelligence**.

### 1. Smart Award Engine
When multiple suppliers quote, the system scores each 0–100 using:
- **Price** 45%
- **Delivery speed** 25%
- **Vendor rating** 20%
- **Reliability** 10%

It recommends a winner and explains why in plain English ("Lowest total price", "Fastest delivery", "Beats next-best by 12 points").

**Where to show it:** Open RFQ **"Annual Stationery Supply"** (RFQ-2026-0008).

### 2. Savings Tracking
Each RFQ has a budget. When a PO is awarded, the app calculates savings vs highest bid and vs budget. Dashboard and Reports show **Total Savings**.

### 3. Automatic Approval Routing
- **≤ ₹1,00,000** → auto-approves instantly
- **≤ ₹10,00,000** → goes to Manager
- **Above ₹10,00,000** → goes to Admin

**Where to show it:** Approvals page (log in as Manager), or RFQ "Conference Room AV Setup" (pending).

### 4. 3-Way Match
Invoice is only "Matched" when **Order = Goods Received = Invoice** all agree. Prevents paying for undelivered goods.

**Where to show it:** Invoices page — badges: ✓ Matched / Mismatch / Awaiting goods.

### 5. Vendor Scorecards
Each vendor gets a grade **A–D** based on rating, win rate, fulfillment, and spend.

**Where to show it:** Reports page → Vendor Scorecards table.

### 6. PDF Documents & CSV Export
Real PDF purchase orders and invoices (download/print/email). Reports can export to CSV.

---

## 9. Demo data currently loaded

After running `npm run db:reseed`, the database has:

| Data | Count |
|------|-------|
| Vendors | 10 (Active, Pending, Inactive, Blacklisted) |
| Users | 8 (staff + vendor logins) |
| RFQs | 14 (Draft, Open, Awarded, Cancelled) |
| Quotations | 24 |
| Approvals | 10 (2 pending, 7 approved, 1 rejected) |
| Purchase Orders | 7 |
| Goods Receipts | 6 |
| Invoices | 7 (Draft, Sent, Paid + various match statuses) |
| Activity logs | 53 |
| Notifications | 37 |

### Best RFQs to open for screenshots

| RFQ | Why |
|-----|-----|
| **Annual Stationery Supply** | 3 competing quotes + Smart Award banner |
| **Conference Room AV Setup** | Pending approval (Manager demo) |
| **Office Security Camera System** | Pending Admin sign-off (large spend) |
| **Procurement of 50 Office Laptops** | Fully completed — PO, goods, paid invoice |
| **100 Ergonomic Office Chairs** | Partial delivery + invoice mismatch |

---

## 10. 5-minute demo script (for presentation)

1. **Login** as `officer@vendorbridge.com` (click demo button)
2. **Dashboard** — point at spend, savings, recent POs
3. **RFQs → Annual Stationery Supply** — show Smart Award recommendation
4. **Sign out → Login as Manager** → **Approvals** → Approve one item
5. **Sign back in as Officer** → **Purchase Orders** → show savings + PDF
6. **Goods Receipts** — show received items
7. **Invoices** — show 3-way match badges → download a PDF
8. **Reports** — charts, scorecards, Export CSV
9. **Activity** — audit trail

---

## 11. Full tech stack (complete list)

Everything we used to build VendorBridge — learn these names for viva.

### Frontend (what the user sees in the browser)

| Technology | Version | Why we used it |
|------------|---------|----------------|
| **Next.js** | 14.2 | React framework — runs both the website AND the server in one project |
| **React** | 18.3 | UI library — builds interactive pages (buttons, forms, tables) |
| **TypeScript** | 5.6 | JavaScript with types — catches bugs before runtime, safer code |
| **Tailwind CSS** | 3.4 | Utility-first CSS — fast, clean, modern styling |
| **PostCSS + Autoprefixer** | — | Makes CSS work in all browsers |

### Backend (server logic — runs when user clicks something)

| Technology | Version | Why we used it |
|------------|---------|----------------|
| **Next.js App Router** | 14 | File-based routing — each page and API lives in `src/app/` |
| **Next.js API Routes** | 14 | 25 REST endpoints in `src/app/api/` — no separate backend server needed |
| **Node.js** | 20+ | JavaScript runtime that runs the server |

### Database (where all data is stored)

| Technology | Version | Why we used it |
|------------|---------|----------------|
| **PostgreSQL** | 16 / 18 | Industry-standard relational database — reliable, supports complex queries |
| **Prisma ORM** | 5.22 | Talks to PostgreSQL using TypeScript — type-safe database queries |
| **Prisma Client** | 5.22 | Auto-generated code to read/write database tables |
| **embedded-postgres** | 18.4 | Runs PostgreSQL locally with zero install (dev only) |
| **Docker Compose** | — | Optional way to run PostgreSQL in a container |

### Authentication & Security

| Technology | Version | Why we used it |
|------------|---------|----------------|
| **JWT (jose library)** | 5.9 | Signed session tokens — keeps users logged in securely |
| **bcryptjs** | 2.4 | Hashes passwords — never stores plain text passwords |
| **Middleware** | Next.js | Checks login on every page before loading — redirects to login if not signed in |
| **RBAC** (custom) | — | Role-Based Access Control — Officer/Manager/Vendor/Admin see different data |

### Documents & Communication

| Technology | Version | Why we used it |
|------------|---------|----------------|
| **pdfkit** | 0.15 | Generates real PDF files for Purchase Orders and Invoices |
| **nodemailer** | 6.9 | Sends invoice emails to vendors (falls back to console log if no SMTP) |

### Dev Tools & Deployment

| Technology | Why we used it |
|------------|----------------|
| **tsx** | Runs TypeScript seed scripts directly |
| **Vercel** | Cloud hosting for Next.js (production deploy) |
| **Neon** | Cloud PostgreSQL database (production deploy) |
| **Git / GitHub** | Version control and code sharing |

### Architecture in one sentence

> **Next.js full-stack app** — React pages on the front, API routes on the back, **Prisma + PostgreSQL** for data, **JWT + bcrypt** for security, **pdfkit + nodemailer** for documents.

### Architecture diagram (for viva board)

```
Browser (React + Tailwind)
        ↕ HTTP requests
Next.js Server (API Routes + Middleware)
        ↕ Prisma ORM
PostgreSQL Database (14 tables)
```

---

## 12. Project folder structure

```
vendorbridge/
├── START_HERE.md          ← THIS FILE (read me first)
├── README.md              ← Short project readme
├── GUIDE.md               ← Plain-English feature guide
├── run.bat / run.sh       ← One-click launcher
├── package.json           ← Dependencies & scripts
├── .env.example           ← Environment config template
├── docker-compose.yml     ← Optional PostgreSQL via Docker
├── prisma/
│   ├── schema.prisma      ← Database structure (14 models)
│   └── seed.ts            ← Demo data loader
├── scripts/
│   ├── dev-local.mjs      ← Starts embedded DB + app
│   └── reseed.mjs         ← Reload demo data
└── src/
    ├── middleware.ts       ← Auth guard on every route
    ├── app/
    │   ├── (app)/          ← Main pages (dashboard, rfqs, etc.)
    │   ├── login/          ← Login page
    │   └── api/            ← 25 API endpoints
    ├── lib/
    │   ├── scoring.ts      ← Smart Award engine
    │   ├── approval-policy.ts  ← Approval thresholds
    │   ├── scorecard.ts    ← Vendor grades A–D
    │   ├── match.ts        ← 3-way match logic
    │   ├── pdf.ts          ← Invoice PDF
    │   ├── po-pdf.ts       ← PO PDF
    │   ├── auth.ts         ← Login/sessions
    │   └── rbac.ts         ← Role permissions
    └── components/         ← Sidebar, badges, headers
```

---

## 13. Database models (14 tables)

| Model | Stores |
|-------|--------|
| User | Login accounts (officer, manager, vendor, admin) |
| Vendor | Supplier companies |
| RFQ | Purchase requests |
| RFQItem | Line items in an RFQ (product, quantity) |
| RFQVendor | Which vendors were invited |
| Quotation | Vendor's price reply |
| QuotationItem | Price per line item |
| Approval | Manager approve/reject record |
| PurchaseOrder | Official order |
| GoodsReceipt | Delivery confirmation |
| GoodsReceiptItem | Quantities received per item |
| Invoice | Bill for payment |
| ActivityLog | Audit trail |
| Notification | User alerts |

---

## 14. API endpoints (25 routes)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | Sign in |
| `POST /api/auth/logout` | Sign out |
| `POST /api/auth/signup` | Register |
| `POST /api/auth/forgot-password` | Password reset |
| `GET /api/me` | Current user info |
| `GET/POST /api/vendors` | List/create vendors |
| `PATCH /api/vendors/[id]` | Edit vendor |
| `GET/POST /api/rfqs` | List/create RFQs |
| `GET/PATCH /api/rfqs/[id]` | RFQ detail / update |
| `GET /api/rfqs/[id]/recommendation` | Smart Award scores |
| `GET/POST /api/quotations` | Vendor quotes |
| `GET/PATCH /api/approvals` | Approval queue |
| `GET/POST /api/purchase-orders` | PO list / create |
| `GET /api/purchase-orders/[id]/pdf` | Download PO PDF |
| `GET/POST /api/goods-receipts` | Goods receipts |
| `GET/POST /api/invoices` | Invoices |
| `GET /api/invoices/[id]/pdf` | Download invoice PDF |
| `POST /api/invoices/[id]/send` | Email invoice |
| `GET /api/dashboard` | Dashboard stats |
| `GET /api/reports` | Analytics data |
| `GET /api/reports/export` | CSV download |
| `GET /api/scorecard` | Vendor grades |
| `GET /api/activity` | Audit log |
| `GET/PATCH /api/notifications` | Notifications |
| `POST /api/upload` | File attachments |

---

## 15. Useful commands

| Command | What it does |
|---------|--------------|
| `npm run dev:local` | Start app + embedded database (recommended) |
| `npm run dev` | Start app only (needs `.env` with DATABASE_URL) |
| `npm run db:reseed` | Reload all demo data |
| `npm run db:seed` | Seed database |
| `npm run db:push` | Sync database schema |
| `npm run db:studio` | Visual database browser |
| `npm run build` | Production build |
| `npm run start` | Run production server |

---

## 16. Environment variables (`.env`)

```ini
DATABASE_URL="postgresql://..."    # Database connection
JWT_SECRET="long-random-secret"    # Session security (32+ chars)

# Optional — without these, "email invoice" prints to terminal
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

For local dev with `npm run dev:local`, you don't need to create `.env` — it auto-creates `.env.local`.

---

## 17. 10 Viva Questions & Answers (memorize these)

Simple answers anyone on the team can say in viva. Read each Q and A out loud once.

---

### Q1. What is VendorBridge and what problem does it solve?

**Answer:**
VendorBridge is a **Procurement and Vendor Management ERP**. It solves the problem of companies buying goods in a messy way — through emails, phone calls, and Excel sheets. Our app digitizes the **entire buying process** in one place: from asking suppliers for prices, to approving purchases, placing orders, receiving goods, and paying invoices. It saves time, reduces errors, and helps companies spend money smarter.

---

### Q2. Who are the users of your system?

**Answer:**
There are **four types of users**:
1. **Procurement Officer** — the buyer who creates requests and selects suppliers
2. **Vendor** — the supplier who submits price quotes
3. **Manager** — approves medium-size purchases
4. **Admin** — has full access and approves large purchases

Each role sees **only what they need**. For example, a vendor cannot see another vendor's prices.

---

### Q3. Explain the complete workflow of your project.

**Answer:**
The workflow has these steps:
1. Officer **creates an RFQ** (Request for Quotation) and invites vendors
2. Vendors **submit their price quotes**
3. Our **Smart Award engine** ranks the quotes and recommends the best one
4. Officer **selects a winner** → system sends it for **approval**
5. Manager **approves** (small orders auto-approve under ₹1 lakh)
6. System generates a **Purchase Order (PO)**
7. When goods arrive, officer records a **Goods Receipt**
8. System creates an **Invoice** and checks **3-way match**
9. Invoice can be **downloaded as PDF or emailed**
10. Everything shows in **Reports and Activity log**

---

### Q4. What is the Smart Award Engine? Why is it special?

**Answer:**
The Smart Award Engine is our **intelligent quote comparison system**. When multiple vendors submit prices, it does NOT just pick the cheapest. It scores each quote out of 100 using a weighted formula:
- **Price — 45%**
- **Delivery speed — 25%**
- **Vendor rating — 20%**
- **Reliability — 10%**

It then **recommends the best overall value** and explains why in plain English — like "Lowest total price" or "Fastest delivery." This makes buying decisions **fair, transparent, and defensible** — like having a smart assistant for procurement.

---

### Q5. What is 3-way match? Why is it important?

**Answer:**
**3-way match** is a financial control used in real companies. Before paying an invoice, the system checks that **three things agree**:
1. **Purchase Order** — what we ordered
2. **Goods Receipt** — what we actually received
3. **Invoice** — what the vendor is billing us

If all three match → invoice shows **"✓ Matched"**. If goods are not fully received → **"Mismatch"**. This **prevents paying for items that were never delivered** — a common problem in manual procurement.

---

### Q6. What tech stack did you use and why?

**Answer:**
We used a **modern full-stack JavaScript** setup:
- **Next.js 14 + React + TypeScript** — for the frontend and backend in one project
- **PostgreSQL** — reliable database for storing all procurement data
- **Prisma** — ORM that connects our code to the database safely
- **Tailwind CSS** — for clean, responsive UI design
- **JWT + bcrypt** — for secure login and password hashing
- **pdfkit** — to generate PDF purchase orders and invoices
- **nodemailer** — to email invoices to vendors

We chose Next.js because it is **production-grade**, widely used in industry, and lets us build both frontend and API in one codebase — perfect for an ERP.

---

### Q7. How is security handled in your project?

**Answer:**
Security is built at multiple levels:
1. **Passwords are hashed** with bcrypt — never stored as plain text
2. **JWT tokens** in httpOnly cookies keep sessions secure
3. **Middleware** checks login on every page — unauthenticated users are redirected
4. **RBAC (Role-Based Access Control)** — every API checks the user's role before allowing action
5. **Vendor isolation** — vendors can only see RFQs they were invited to and their own data

Security is enforced on the **server side**, not just hidden in the UI — so it cannot be bypassed.

---

### Q8. What is automatic approval routing?

**Answer:**
In real companies, not every purchase needs the CEO's approval. We built **delegation of authority**:
- **≤ ₹1,00,000** → **Auto-approved** instantly (no waiting)
- **≤ ₹10,00,000** → goes to **Manager** for approval
- **Above ₹10,00,000** → goes to **Admin** for sign-off

The system decides the right approval path **automatically** based on the order amount. This mirrors how real enterprises control spending.

---

### Q9. What makes your project different from a basic CRUD application?

**Answer:**
A basic CRUD app only has Create, Read, Update, Delete forms. VendorBridge adds **real ERP intelligence**:
1. **Smart Award** — explainable AI-style scoring, not just lowest price
2. **Savings tracking** — shows how much money was saved vs budget
3. **Automatic approval routing** — spend-based delegation
4. **3-way match** — financial control before payment
5. **Vendor scorecards** — automatic A–D performance grades
6. **PDF documents** — professional PO and invoice generation
7. **Full audit trail** — every action is logged

We built a **working procurement ERP**, not just a data entry website.

---

### Q10. How did you test/demo the project? What data is loaded?

**Answer:**
We loaded a **full demo dataset** with:
- 10 vendors, 14 RFQs, 24 quotations, 7 purchase orders, 7 invoices
- Data in every status — pending approvals, matched invoices, rejected quotes, draft RFQs
- Demo login accounts for all roles (password: `password123`)

To run locally: `npm run dev:local` opens the app at **http://localhost:3000** with embedded PostgreSQL — no Docker needed. To reload data: `npm run db:reseed`.

For production, we can deploy on **Vercel + Neon** (free cloud hosting + database).

---

### Bonus Q11. What is an ERP? Is VendorBridge a full ERP?

**Answer:**
**ERP** stands for **Enterprise Resource Planning** — software that manages core business processes in one system. VendorBridge is a **focused ERP module** for **procurement** (the buying side of a business). It covers the full procurement lifecycle: vendors → RFQs → quotes → approvals → POs → goods receipt → invoices → reports. It is not a full company ERP like SAP or Odoo, but it is a **complete, production-quality procurement module** with intelligence features that many basic systems lack.

---

### Bonus Q12. What improvements can be done in the future?

**Answer:**
Future enhancements could include:
- Mobile app for vendors to submit quotes on phone
- Integration with accounting software (Tally, QuickBooks)
- Multi-company / multi-branch support
- AI-powered demand forecasting
- Cloud file storage for RFQ attachments (AWS S3)
- Email notifications via real SMTP in production
- Database migrations instead of `db push` for large-scale deployment

The current core is complete and working — these are natural next steps for scaling.

---

## 18. Deploy to internet (optional)

**Quick local demo for judges:** While app runs locally:
```bash
npx localtunnel --port 3000
```
This gives a temporary public URL.

**Permanent deploy:** Neon (free PostgreSQL) + Vercel (free hosting). See `DEPLOY.md` for step-by-step.

---

## 19. Other files in this repo

| File | Contents |
|------|----------|
| `START_HERE.md` | **This file — everything in one place** |
| `README.md` | Short readme for GitHub |
| `GUIDE.md` | Plain-English walkthrough of features |
| `DEPLOY.md` | How to deploy online |
| `TEAMMATE_SETUP.md` | Setup for team members using shared cloud DB |
| `VIDEO_SCRIPT.md` | Full voiceover script for demo video (~5 min) |

---

## 20. Quick cheat sheet (print this)

```
APP URL:     http://localhost:3000
PASSWORD:    password123 (all accounts)

START:       npm run dev:local   OR   double-click run.bat
RELOAD DATA: npm run db:reseed
STOP:        Ctrl + C

BEST LOGIN:  officer@vendorbridge.com  (buyer — start here)
APPROVALS:   manager@vendorbridge.com
REPORTS:     admin@vendorbridge.com

STAR FEATURE: Smart Award on "Annual Stationery Supply" RFQ
STAR PAGE:    /reports (charts + scorecards + CSV)
STAR FLOW:    RFQ → Quote → Approve → PO → Receive → Invoice → Match

VIVA PREP:    Read Section 11 (tech stack) + Section 17 (10 Q&A)
```

---

*You now have everything about VendorBridge in one file. Open the app, log in as the officer, and walk through the 5-minute demo in Section 10.*
