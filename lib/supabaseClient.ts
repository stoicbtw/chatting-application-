"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser client using the public anon key. Read-only by RLS; used for
// Realtime subscriptions (messages, reactions, presence, broadcast).
let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  cached = createClient<any>(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return cached;
}
