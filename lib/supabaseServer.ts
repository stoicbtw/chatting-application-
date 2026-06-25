import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service_role key.
// Bypasses RLS — NEVER import this into a client component.
let cached: ReturnType<typeof createClient<any>> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  cached = createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
