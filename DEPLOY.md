# Deploying VendorBridge to a public URL

The app needs two things in the cloud: a **PostgreSQL database** and a **Next.js host**.
The fastest free path is **Neon** (database) + **Vercel** (host). ~10 minutes, no credit card.

---

## Option A — Run it locally (fastest, for the demo)

On your machine, inside the `vendorbridge` folder:

- **Windows:** double-click **`run.bat`**
- **macOS / Linux:** `./run.sh`

It installs everything, starts an **embedded PostgreSQL automatically (no Docker needed)**,
loads demo data, and opens **http://localhost:3000**. The only requirement is **Node.js**.

To share that local server on the internet temporarily for judging, run a tunnel in a
second terminal:

```bash
npx localtunnel --port 3000
# or, if you have it: ngrok http 3000
```

This prints a public https URL that points at your laptop while it's running — perfect
for a live hackathon demo.

---

## Option B — Permanent public deploy (Vercel + Neon)

### 1. Create the database (Neon)
1. Sign up at **https://neon.tech** (free).
2. Create a project → copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`).

### 2. Push your code to GitHub
```bash
cd vendorbridge
git init && git add . && git commit -m "VendorBridge"
git branch -M main
git remote add origin https://github.com/<you>/vendorbridge.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Sign up at **https://vercel.com** and **Import** your GitHub repo.
2. In the project's **Settings → Environment Variables**, add:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = any long random string (32+ characters)
   - *(optional)* `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for real invoice email
3. Click **Deploy**. The included `vercel.json` runs `prisma db push` during the build,
   so your tables are created automatically.

### 4. Seed the live database (one time)
From your machine, with the Neon URL:
```bash
# PowerShell
$env:DATABASE_URL="<your-neon-url>"; npm run db:seed
# macOS / Linux
DATABASE_URL="<your-neon-url>" npm run db:seed
```

Done — Vercel gives you a public URL like `https://vendorbridge.vercel.app`.
Log in with `officer@vendorbridge.com` / `password123`.

---

## Notes
- The production build is verified green and the server boots and serves over HTTP
  (login, auth guard, and session cookies all tested).
- `prisma db push` is used instead of migrations for speed; for a long-lived production
  app you'd switch to `prisma migrate deploy`.
- Keep `JWT_SECRET` private and unique per environment.
