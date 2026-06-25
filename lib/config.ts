// Public Supabase config. The URL + anon key are designed to be public
// (they ship in the browser bundle anyway), so we keep baked-in fallbacks
// to make zero-config deploys "just work". Env vars override them.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wtmeqjocpbjlnnfceadx.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bWVxam9jcGJqbG5uZmNlYWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTQ0NTksImV4cCI6MjA5Nzk3MDQ1OX0.VWDgaOi-3-XzBGakBKScAFpeVp6bOiArjcFaXlz68Xo";
