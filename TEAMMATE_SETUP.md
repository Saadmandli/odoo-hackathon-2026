# Running VendorBridge on your PC (teammate setup)

The app uses a **shared Neon cloud database** that's already filled with demo data —
so once you run it, every page is populated and matches everyone else.

## You need (one time)
- **Node.js** — download the LTS version from https://nodejs.org and install it.
- **Git** — from https://git-scm.com/download/win (Windows).

## Steps

1. **Get the code.** Open a terminal (on Windows: open any folder, type `cmd` in the
   address bar, Enter) and run:
   ```
   git clone https://github.com/Saadmandli/odoo-hackathon-2026.git
   cd odoo-hackathon-2026
   ```
   (If the project is in a subfolder like `vendorbridge`, `cd` into that.)

2. **Create your .env** (this connects you to the shared database):
   ```
   copy .env.example .env
   ```
   (Mac/Linux: `cp .env.example .env`)

3. **Install and run:**
   ```
   npm install
   npm run dev
   ```

4. Open **http://localhost:3000** and log in (click a demo button):

   | Email | Password | Role |
   |-------|----------|------|
   | officer@vendorbridge.com | password123 | Procurement Officer |
   | manager@vendorbridge.com | password123 | Manager / Approver |
   | admin@vendorbridge.com | password123 | Admin |
   | vendor@techno.com | password123 | Vendor |

## Important
- Use **`npm run dev`** (connects to the shared Neon cloud database).
- Do **NOT** use `npm run dev:local` — that starts a separate empty offline database.
- Keep the terminal window open while using the app; stop it with **Ctrl + C**.
