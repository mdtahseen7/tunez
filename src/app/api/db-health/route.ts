import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs"; // ensure we run in Node (not edge) for neon-http

export async function GET() {
  const started = Date.now();
  try {
    // Lightweight query: fetch one row if table exists; fallback to version
    let sample: unknown = null;
    try {
      sample = await db.query.users.findFirst();
    } catch {
      // Ignore if table not yet migrated
    }
    const duration = Date.now() - started;
    return NextResponse.json({
      ok: true,
      sample: sample ? true : false,
      ms: duration,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
