// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
