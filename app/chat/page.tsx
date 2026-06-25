import { redirect } from "next/navigation";
import { getSessionId } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { PROFILE_COLS, type Message, type Profile, type Reaction } from "@/lib/types";
import ChatRoom from "@/components/ChatRoom";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const id = await getSessionId();
  if (!id) redirect("/login");

  const db = supabaseAdmin();

  const { data: meRow } = await db.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
  if (!meRow) redirect("/login");
  const me = meRow as unknown as Profile;

  const { data: others } = await db
    .from("profiles")
    .select(PROFILE_COLS)
    .neq("id", id)
    .order("created_at")
    .limit(1);
  const partner = (others?.[0] as unknown as Profile) ?? null;

  const { data: msgRows } = await db
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(300);
  const messages = (msgRows as unknown as Message[]) ?? [];

  // attach reactions
  const ids = messages.map((m) => m.id);
  let reactions: Reaction[] = [];
  if (ids.length) {
    const { data: rx } = await db.from("reactions").select("*").in("message_id", ids);
    reactions = (rx as unknown as Reaction[]) ?? [];
  }
  const byMsg = new Map<string, Reaction[]>();
  for (const r of reactions) {
    const arr = byMsg.get(r.message_id) ?? [];
    arr.push(r);
    byMsg.set(r.message_id, arr);
  }
  for (const m of messages) m.reactions = byMsg.get(m.id) ?? [];

  return <ChatRoom me={me} partner={partner} initialMessages={messages} />;
}
