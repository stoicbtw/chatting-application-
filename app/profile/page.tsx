import { redirect } from "next/navigation";
import { getSessionId } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { PROFILE_COLS, type Profile } from "@/lib/types";
import ProfileEditor from "@/components/ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const id = await getSessionId();
  if (!id) redirect("/login");
  const db = supabaseAdmin();
  const { data } = await db.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
  if (!data) redirect("/login");
  return (
    <main className="relative z-10 min-h-dvh flex justify-center p-3">
      <ProfileEditor profile={data as unknown as Profile} />
    </main>
  );
}
