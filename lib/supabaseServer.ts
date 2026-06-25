import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

// Server-side Supabase client used by server actions.
// Prefers the service_role secret (bypasses RLS) when provided; otherwise
// falls back to the anon key, which works because RLS allows writes for this
// private 2-person app. NEVER import this into a client component.
let cached: ReturnType<typeof createClient<any>> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  cached = createClient<any>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
