// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserDocumentsCollection } from "@/lib/mongodb";

export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/upload";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const lang = req.nextUrl.searchParams.get("lang") || "eng";

    const upstream = new FormData();
    upstream.append("file", file, file.name);

    const res = await fetch(`${BACKEND_URL}?lang=${encodeURIComponent(lang)}`, {
      method: "POST",
      body: upstream,
    });

    const data = await res.json();

    if (res.ok) {
      try {
        const docs = await getUserDocumentsCollection();
        const userId = req.nextUrl.searchParams.get("userId") || "anonymous";
        await docs.insertOne({
          userId,
          filename: file.name,
          text: data.text,
          meta: data.meta,
          warnings: data.warnings,
          uploadedAt: new Date(),
        });
      } catch (err) {
        console.error("Mongo insert error", err);
      }
    }

      return NextResponse.json(data, { status: res.status });
    } catch (e: unknown) {
      return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proxy error" },
      { status: 500 }
      );
    }
}
