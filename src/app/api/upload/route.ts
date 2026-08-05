import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/rbac";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Handles RFQ attachment uploads (PDF, images, docs). Saves under /public/uploads.
export async function POST(req: Request) {
  try {
    await requireUser(["ADMIN", "BUYER"]);
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}-${(file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(dir, safe), bytes);

    return NextResponse.json({ url: `/uploads/${safe}`, name: file.name });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
