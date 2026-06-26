import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Auto-destruct: if a nest goes cold (no login / message) for 30 days — which
// is what happens when BOTH people forget their passcodes and nobody can get
// back in — it quietly disappears (cascade deletes its profiles + messages).
// Triggered daily by Vercel Cron (see vercel.json).

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const db = supabaseAdmin();
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const { data, error } = await db.from("nests").delete().lt("last_active", cutoff).select("slug");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, destroyed: data?.length ?? 0, slugs: (data ?? []).map((n: any) => n.slug) });
}
