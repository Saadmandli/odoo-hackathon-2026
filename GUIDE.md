# VendorBridge — Complete Guide (Plain English)

A friendly walkthrough of *everything* your website does. No jargon. Read this and you can confidently demo and defend the project.

---

## 1. What is VendorBridge? (the one-line answer)

> VendorBridge is software that helps a company **buy things from suppliers in an organized, paperless way** — from asking suppliers for prices, to picking the best one, getting approval, placing the order, receiving the goods, and paying the invoice.

In business this whole process is called **procurement**. Today many companies still do it over email and Excel, which is slow and error-prone. VendorBridge puts the entire process in one clean web app.

**The real-world story it automates:**
A company needs to buy 50 laptops. Instead of emailing suppliers one by one, they post a request, suppliers reply with their prices, the system helps pick the best deal, a manager approves it, an official order is created, the laptops arrive, and an invoice is generated and emailed — all tracked in one place.

---

## 2. The 4 types of users (roles)

Different people see different things. This is called **role-based access**.

| Role | Who they are | What they can do |
|------|--------------|------------------|
| **Procurement Officer** | The buyer | Creates requests, compares offers, picks winners, creates orders & invoices |
| **Vendor** | The supplier | Sees requests they're invited to, submits their price quote, views their orders |
| **Manager / Approver** | The boss | Approves or rejects big purchases |
| **Admin** | IT / owner | Can do everything; manages users and sees all analytics |

A vendor can **never** see another vendor's prices, and can only see requests they were specifically invited to. That privacy is enforced by the system, not by trust.

---

## 3. Key business terms (so you sound confident)

- **RFQ (Request for Quotation):** A formal "please send me your price" request. The buyer lists what they want (e.g. "50 laptops") and sends it to chosen suppliers.
- **Quotation (Quote):** A supplier's reply with their prices and delivery time.
- **Approval:** A manager signing off before money is spent.
- **PO (Purchase Order):** The official order document sent to the winning supplier ("Yes, we're buying — please deliver").
- **Goods Receipt (GRN):** Confirmation that the items actually arrived.
- **Invoice:** The bill for the order.
- **GST:** Indian tax added to the bill (we use 18%).

---

## 4. Every screen, explained

**Login / Signup / Forgot Password**
The front door. You sign in with email + password. New users can sign up and pick a role. Forgot-password sends a reset notice. Sessions are kept securely so you stay logged in.

**Dashboard (home screen)**
Your snapshot. Shows: how many active requests, how many approvals are waiting, total money spent, **total money saved**, and recent orders & invoices. Plus quick buttons to jump to common tasks.

**Vendors**
The supplier address book. Add/edit suppliers with their company name, category (e.g. "IT Hardware"), GST number, contact details, status (Active/Pending/etc.), and a star rating. You can search and filter.

**RFQs (Requests)**
The list of all purchase requests. Click "New RFQ" to create one: give it a title, add the items and quantities, set a budget and deadline, **attach a file** (like a spec sheet), and tick which suppliers to invite. They get notified instantly.

**RFQ Detail (the heart of the app)**
Open any request to see everything. Here:
- **Suppliers** type in their prices (this is the vendor's view).
- **The buyer** sees all quotes side-by-side, ranked by the **Smart Award** score (more below), and picks a winner.

**Approvals**
Managers see purchases waiting for sign-off and click Approve or Reject with a comment. There's a full history of who decided what and when.

**Purchase Orders**
The official orders. Each has an auto-generated number, tax/total calculations, and a **PDF** you can download. When goods arrive you click **Receive** here.

**Goods Receipts**
A record of what was actually delivered against each order.

**Invoices**
The bills. Generate an invoice from an order, then **download, print, or email** it as a professional PDF. Each invoice shows a **3-way match** status (explained below).

**Reports & Analytics**
The big-picture view: total savings, monthly spending charts, spend per vendor, and **vendor scorecards** (A–D grades). Plus an **Export to CSV** button.

**Activity & Notifications**
A complete audit log of every action in the system, plus your personal notification bell (e.g. "You've been invited to quote", "Approval needed").

---

## 5. The 6 "smart" features (your winning edge)

These go beyond the basic requirements — they're what impress judges and interviewers.

**1. Smart Award Engine 🧠**
When several suppliers send quotes, the system doesn't just pick the cheapest. It scores each one out of 100 using a fair formula — Price (45%), Delivery speed (25%), Supplier rating (20%), Reliability (10%) — and **recommends a winner with reasons** ("lowest price", "fastest delivery", "beats the next-best by 12 points"). It's transparent and defensible, like a smart assistant for buyers.

**2. Savings Tracking 💰**
You set a budget for each request. When you award the order, the system calculates how much money you saved (vs the highest quote and vs your budget) and shows a running **"Total Savings"** number. Great for proving the tool pays for itself.

**3. Automatic Approval Routing ⚡**
Small purchases (under ₹1 lakh) approve themselves instantly. Medium ones go to a Manager. Large ones go to Admin. The system decides the right path automatically — just like a real company's spending rules.

**4. 3-Way Match ✅**
Before a bill is considered valid, the system checks that three things agree: the **Order**, the **Goods received**, and the **Invoice**. If they all match, the invoice is marked "✓ Matched". This is a real accounting control that stops companies paying for things they never received.

**5. Vendor Scorecards 🏆**
Every supplier automatically gets a performance grade (A to D) based on their rating, how often they win, how reliably they deliver, and how much business they do. This helps buyers choose trustworthy suppliers.

**6. Professional Documents 📄**
Real PDF purchase orders and invoices (with your branding, tax breakdown, totals) that can be printed or emailed, plus CSV export of all data.

---

## 6. How it all flows (the complete journey)

```
1. Officer creates an RFQ  →  invites suppliers
2. Suppliers submit their price quotes
3. Smart Award ranks the quotes & recommends a winner
4. Officer selects the winner  →  approval is requested
5. Manager approves (or small orders auto-approve)
6. A Purchase Order is generated (savings recorded)
7. Goods arrive  →  Officer records the Goods Receipt
8. An Invoice is generated  →  3-way match confirms it
9. Invoice is printed / emailed to the vendor
10. Everything appears in Reports, Analytics & the Activity log
```

---

## 7. The technology (for technical questions)

- **Next.js 14 + React + TypeScript** — the framework that runs both the website you see and the server logic behind it.
- **PostgreSQL database** with **Prisma** — where all the data (vendors, orders, etc.) is safely stored. 14 connected data tables.
- **Tailwind CSS** — the styling that makes it look clean and modern.
- **Secure login** — passwords are encrypted (bcrypt); sessions use signed tokens (JWT) stored in secure cookies.
- **PDF generation** (pdfkit) and **email** (nodemailer) for the documents.
- **24 API endpoints** powering the features, **11 screens**, all with role-based security.

**If asked "is it secure?":** Yes — passwords are hashed, every action checks the user's role on the server, and suppliers are walled off from each other's data.

**If asked "is it production-ready?":** The core is, yes. For a large live deployment you'd add cloud file storage for attachments and switch to database migrations — both small, well-understood steps.

---

## 8. Quick answers to likely judge/interviewer questions

- *"What problem does it solve?"* → Procurement is slow, manual, and error-prone; we digitize the whole thing and add intelligence to make better buying decisions.
- *"What's unique vs a basic CRUD app?"* → The Smart Award scoring, automatic approval routing, savings tracking, and 3-way match — real ERP intelligence, not just forms.
- *"How does it save money?"* → It surfaces the best-value quote and tracks realized savings against budget and highest bid.
- *"Who are the users?"* → Procurement officers, vendors, managers, and admins — each with tailored, secure access.

---

*You built a real, working Procurement ERP. Read this twice and you'll be able to walk anyone through it with confidence.*
