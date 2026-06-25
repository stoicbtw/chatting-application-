"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getSessionId, setSession, clearSession, hashPasscode } from "@/lib/session";
import { PROFILE_COLS, type Profile, type Message } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

// ── auth ──────────────────────────────────────────────────

export async function listProfiles(): Promise<Pick<Profile, "id" | "name" | "display_name" | "avatar_emoji" | "accent">[]> {
  const db = supabaseAdmin();
  const { data } = await db.from("profiles").select("id,name,display_name,avatar_emoji,accent").order("created_at");
  return (data as any) ?? [];
}

export async function loginOrCreate(input: {
  name: string;
  passcode: string;
  display_name?: string;
  avatar_emoji?: string;
}): Promise<Result> {
  const name = input.name.trim().toLowerCase();
  const passcode = input.passcode.trim();
  if (!name || name.length < 2) return { ok: false, error: "Pick a name (2+ letters) 🐣" };
  if (passcode.length < 3) return { ok: false, error: "Passcode needs 3+ characters 🔑" };

  const db = supabaseAdmin();
  const hash = hashPasscode(passcode);

  const { data: existing } = await db.from("profiles").select("*").eq("name", name).maybeSingle();

  if (existing) {
    if ((existing as any).passcode_hash !== hash) {
      return { ok: false, error: "Wrong passcode for that name 🙈" };
    }
    await setSession((existing as any).id);
    return { ok: true };
  }

  // creating a new profile — but only two people allowed, ever
  const { count } = await db.from("profiles").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 2) {
    return { ok: false, error: "This nest already has its two birds 🪺 (name not found)" };
  }

  const { data: created, error } = await db
    .from("profiles")
    .insert({
      name,
      passcode_hash: hash,
      display_name: input.display_name?.trim() || input.name.trim(),
      avatar_emoji: input.avatar_emoji || "🐰",
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: "Could not create your profile 😢" };
  await setSession((created as any).id);
  return { ok: true };
}

export async function logout() {
  await clearSession();
}

// ── current user ──────────────────────────────────────────

export async function getMe(): Promise<Profile | null> {
  const id = await getSessionId();
  if (!id) return null;
  const db = supabaseAdmin();
  const { data } = await db.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
  return (data as any) ?? null;
}

async function requireId(): Promise<string> {
  const id = await getSessionId();
  if (!id) throw new Error("Not logged in");
  return id;
}

// ── messages ──────────────────────────────────────────────

export async function sendMessage(input: {
  kind?: "text" | "gif" | "sticker";
  content?: string;
  gif_url?: string;
  reply_to?: string | null;
}): Promise<Result & { message?: Message }> {
  const id = await requireId();
  const kind = input.kind ?? "text";
  const content = (input.content ?? "").slice(0, 4000);
  if (kind === "text" && !content.trim()) return { ok: false, error: "empty" };
  if (kind === "gif" && !input.gif_url) return { ok: false, error: "no gif" };

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("messages")
    .insert({
      sender_id: id,
      kind,
      content,
      gif_url: input.gif_url ?? null,
      reply_to: input.reply_to ?? null,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };

  // pet gains 1 xp per message (read-modify-write; fine for 2 people)
  const { data: prof } = await db.from("profiles").select("pet_xp").eq("id", id).single();
  await db.from("profiles").update({ pet_xp: ((prof as any)?.pet_xp ?? 0) + 1, last_seen: new Date().toISOString() }).eq("id", id);

  return { ok: true, message: { ...(row as any), reactions: [] } };
}

export async function editMessage(messageId: string, content: string): Promise<Result> {
  const id = await requireId();
  const db = supabaseAdmin();
  const { error } = await db
    .from("messages")
    .update({ content: content.slice(0, 4000), edited: true })
    .eq("id", messageId)
    .eq("sender_id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteMessage(messageId: string): Promise<Result> {
  const id = await requireId();
  const db = supabaseAdmin();
  const { error } = await db.from("messages").delete().eq("id", messageId).eq("sender_id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── reactions ─────────────────────────────────────────────

export async function toggleReaction(messageId: string, emoji: string): Promise<Result> {
  const id = await requireId();
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("profile_id", id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await db.from("reactions").delete().eq("id", (existing as any).id);
  } else {
    await db.from("reactions").insert({ message_id: messageId, profile_id: id, emoji });
  }
  return { ok: true };
}

// ── mood / profile ────────────────────────────────────────

export async function setMood(emoji: string, label: string): Promise<Result> {
  const id = await requireId();
  const db = supabaseAdmin();
  const { error } = await db
    .from("profiles")
    .update({ mood_emoji: emoji, mood_label: label, last_seen: new Date().toISOString() })
    .eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateProfile(patch: {
  display_name?: string;
  avatar_emoji?: string;
  accent?: string;
  bio?: string;
  about?: Record<string, string>;
  pet_name?: string;
}): Promise<Result> {
  const id = await requireId();
  const db = supabaseAdmin();
  const clean: Record<string, unknown> = {};
  if (patch.display_name !== undefined) clean.display_name = patch.display_name.slice(0, 40);
  if (patch.avatar_emoji !== undefined) clean.avatar_emoji = patch.avatar_emoji;
  if (patch.accent !== undefined) clean.accent = patch.accent;
  if (patch.bio !== undefined) clean.bio = patch.bio.slice(0, 500);
  if (patch.about !== undefined) clean.about = patch.about;
  if (patch.pet_name !== undefined) clean.pet_name = patch.pet_name.slice(0, 24);
  const { error } = await db.from("profiles").update(clean).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile");
  revalidatePath("/chat");
  return { ok: true };
}

// ── presence heartbeat ────────────────────────────────────

export async function heartbeat(): Promise<void> {
  const id = await getSessionId();
  if (!id) return;
  const db = supabaseAdmin();
  await db.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", id);
}

// ── nudges (poke / love / hug) ────────────────────────────

export async function sendNudge(toId: string, kind: "poke" | "love" | "hug"): Promise<Result> {
  const id = await requireId();
  const db = supabaseAdmin();
  const { error } = await db.from("nudges").insert({ from_id: id, to_id: toId, kind });
  return error ? { ok: false, error: error.message } : { ok: true };
}
