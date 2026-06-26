"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  getSessionIds,
  addSession,
  removeSession,
  clearAllSessions,
  hasSession,
  hashPasscode,
} from "@/lib/session";
import { PROFILE_COLS, type Profile, type Message, type Nest } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

// ── helpers ───────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

async function bumpNest(nestId: string) {
  const db = supabaseAdmin();
  await db.from("nests").update({ last_active: new Date().toISOString() }).eq("id", nestId);
}

// verify the acting profile is one this device is logged into, return it
async function requireProfile(meId: string): Promise<Profile> {
  if (!(await hasSession(meId))) throw new Error("Not logged in");
  const db = supabaseAdmin();
  const { data } = await db.from("profiles").select(PROFILE_COLS).eq("id", meId).maybeSingle();
  if (!data) throw new Error("Profile not found");
  return data as unknown as Profile;
}

// ── nests: create / unlock / login ────────────────────────

export async function createNest(input: {
  slug: string;
  name: string;
  commonPassword: string;
  displayName: string;
  avatarEmoji?: string;
  passcode: string;
}): Promise<Result & { slug?: string }> {
  const slug = slugify(input.slug || input.name);
  const name = input.name.trim();
  const display = input.displayName.trim();
  if (slug.length < 2) return { ok: false, error: "Nest handle needs 2+ letters 🐣" };
  if (!name) return { ok: false, error: "Give your nest a name 🪺" };
  if (input.commonPassword.trim().length < 3) return { ok: false, error: "Nest password needs 3+ characters 🔑" };
  if (!display) return { ok: false, error: "Tell us your name 💜" };
  if (input.passcode.trim().length < 3) return { ok: false, error: "Your passcode needs 3+ characters 🔑" };

  const db = supabaseAdmin();
  const { data: exists } = await db.from("nests").select("id").eq("slug", slug).maybeSingle();
  if (exists) return { ok: false, error: `"${slug}" is taken — pick another handle 🥺` };

  const { data: nest, error: nestErr } = await db
    .from("nests")
    .insert({ slug, name, common_password_hash: hashPasscode(input.commonPassword.trim()) })
    .select("id,slug")
    .single();
  if (nestErr || !nest) return { ok: false, error: "Could not create the nest 😢" };

  const personalName = slugify(display) || "me";
  const { data: prof, error: pErr } = await db
    .from("profiles")
    .insert({
      nest_id: (nest as any).id,
      name: personalName,
      passcode_hash: hashPasscode(input.passcode.trim()),
      display_name: display,
      avatar_emoji: input.avatarEmoji || "🐰",
    })
    .select("id")
    .single();
  if (pErr || !prof) return { ok: false, error: "Nest made, but your profile failed 😢" };

  await addSession((prof as any).id);
  return { ok: true, slug: (nest as any).slug };
}

// minimal public info — confirms a nest exists, no member identities
export async function getNestPublic(slug: string): Promise<{ exists: boolean; name?: string; slug?: string }> {
  const db = supabaseAdmin();
  const { data } = await db.from("nests").select("name,slug").eq("slug", slug).maybeSingle();
  return data ? { exists: true, name: (data as any).name, slug: (data as any).slug } : { exists: false };
}

type MiniMember = { id: string; name: string; display_name: string; avatar_emoji: string };

// step 1 of entering a nest: prove you know the common password
export async function unlockNest(
  slug: string,
  commonPassword: string
): Promise<{ ok: true; nest: Pick<Nest, "id" | "slug" | "name">; members: MiniMember[]; full: boolean } | { ok: false; error: string }> {
  const db = supabaseAdmin();
  const { data: nest } = await db.from("nests").select("id,slug,name,common_password_hash,member_cap").eq("slug", slug).maybeSingle();
  if (!nest) return { ok: false, error: "No nest by that name 🪹" };
  if ((nest as any).common_password_hash !== hashPasscode(commonPassword.trim())) {
    return { ok: false, error: "Wrong nest password 🙈" };
  }
  const { data: members } = await db
    .from("profiles")
    .select("id,name,display_name,avatar_emoji")
    .eq("nest_id", (nest as any).id)
    .order("created_at");
  const list = (members as MiniMember[]) ?? [];
  return {
    ok: true,
    nest: { id: (nest as any).id, slug: (nest as any).slug, name: (nest as any).name },
    members: list,
    full: list.length >= ((nest as any).member_cap ?? 2),
  };
}

// step 2: log into (or create) your profile in the nest
export async function nestLoginOrJoin(input: {
  slug: string;
  commonPassword: string;
  mode: "login" | "create";
  name?: string; // for login (existing member name)
  passcode: string;
  displayName?: string; // for create
  avatarEmoji?: string;
}): Promise<Result & { slug?: string }> {
  const db = supabaseAdmin();
  const { data: nest } = await db
    .from("nests")
    .select("id,slug,common_password_hash,member_cap")
    .eq("slug", input.slug)
    .maybeSingle();
  if (!nest) return { ok: false, error: "No nest by that name 🪹" };
  if ((nest as any).common_password_hash !== hashPasscode(input.commonPassword.trim())) {
    return { ok: false, error: "Wrong nest password 🙈" };
  }
  const nestId = (nest as any).id;
  const passHash = hashPasscode(input.passcode.trim());

  if (input.mode === "login") {
    const { data: prof } = await db
      .from("profiles")
      .select("id,passcode_hash")
      .eq("nest_id", nestId)
      .eq("name", (input.name ?? "").trim())
      .maybeSingle();
    if (!prof) return { ok: false, error: "Couldn't find you in this nest 🙈" };
    if ((prof as any).passcode_hash !== passHash) return { ok: false, error: "Wrong passcode 🥺" };
    await addSession((prof as any).id);
    await bumpNest(nestId);
    return { ok: true, slug: input.slug };
  }

  // create new member
  const display = (input.displayName ?? "").trim();
  if (!display) return { ok: false, error: "Tell us your name 💜" };
  if (input.passcode.trim().length < 3) return { ok: false, error: "Passcode needs 3+ characters 🔑" };

  const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("nest_id", nestId);
  if ((count ?? 0) >= ((nest as any).member_cap ?? 2)) {
    return { ok: false, error: "This nest already has its two birds 🪺" };
  }
  let personalName = slugify(display) || "me";
  // avoid colliding with the other member's name
  const { data: clash } = await db.from("profiles").select("id").eq("nest_id", nestId).eq("name", personalName).maybeSingle();
  if (clash) personalName = personalName + "-2";

  const { data: prof, error } = await db
    .from("profiles")
    .insert({
      nest_id: nestId,
      name: personalName,
      passcode_hash: passHash,
      display_name: display,
      avatar_emoji: input.avatarEmoji || "🐰",
    })
    .select("id")
    .single();
  if (error || !prof) return { ok: false, error: "Could not create your profile 😢" };
  await addSession((prof as any).id);
  await bumpNest(nestId);
  return { ok: true, slug: input.slug };
}

// nests this device is logged into
export async function listMyNests(): Promise<
  { slug: string; nestName: string; nestId: string; profileId: string; display_name: string; avatar_emoji: string }[]
> {
  const ids = await getSessionIds();
  if (!ids.length) return [];
  const db = supabaseAdmin();
  const { data } = await db
    .from("profiles")
    .select("id,display_name,avatar_emoji,nest_id,nests(slug,name,last_active)")
    .in("id", ids);
  const rows = (data as any[]) ?? [];
  return rows
    .filter((r) => r.nests)
    .map((r) => ({
      slug: r.nests.slug,
      nestName: r.nests.name,
      nestId: r.nest_id,
      profileId: r.id,
      display_name: r.display_name,
      avatar_emoji: r.avatar_emoji,
    }));
}

// my profile inside a particular nest (by slug) if I'm logged into it
export async function myProfileInNest(slug: string): Promise<Profile | null> {
  const ids = await getSessionIds();
  if (!ids.length) return null;
  const db = supabaseAdmin();
  const { data: nest } = await db.from("nests").select("id").eq("slug", slug).maybeSingle();
  if (!nest) return null;
  const { data } = await db
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("nest_id", (nest as any).id)
    .in("id", ids)
    .maybeSingle();
  return (data as unknown as Profile) ?? null;
}

export async function logoutNest(profileId: string) {
  await removeSession(profileId);
}

export async function logoutEverywhere() {
  await clearAllSessions();
}

// ── messages ──────────────────────────────────────────────

export async function sendMessage(input: {
  meId: string;
  kind?: "text" | "gif" | "sticker";
  content?: string;
  gif_url?: string;
  reply_to?: string | null;
}): Promise<Result & { message?: Message }> {
  const me = await requireProfile(input.meId);
  const kind = input.kind ?? "text";
  const content = (input.content ?? "").slice(0, 4000);
  if (kind === "text" && !content.trim()) return { ok: false, error: "empty" };
  if (kind === "gif" && !input.gif_url) return { ok: false, error: "no gif" };

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("messages")
    .insert({
      nest_id: me.nest_id,
      sender_id: me.id,
      kind,
      content,
      gif_url: input.gif_url ?? null,
      reply_to: input.reply_to ?? null,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };

  await db.from("profiles").update({ pet_xp: (me.pet_xp ?? 0) + 1, last_seen: new Date().toISOString() }).eq("id", me.id);
  await bumpNest(me.nest_id);
  return { ok: true, message: { ...(row as any), reactions: [] } };
}

export async function editMessage(meId: string, messageId: string, content: string): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { error } = await db
    .from("messages")
    .update({ content: content.slice(0, 4000), edited: true })
    .eq("id", messageId)
    .eq("sender_id", me.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteMessage(meId: string, messageId: string): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { error } = await db.from("messages").delete().eq("id", messageId).eq("sender_id", me.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function toggleReaction(meId: string, messageId: string, emoji: string): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("profile_id", me.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await db.from("reactions").delete().eq("id", (existing as any).id);
  } else {
    await db.from("reactions").insert({ nest_id: me.nest_id, message_id: messageId, profile_id: me.id, emoji });
  }
  return { ok: true };
}

// ── mood / profile ────────────────────────────────────────

export async function setMood(meId: string, emoji: string, label: string): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { error } = await db
    .from("profiles")
    .update({ mood_emoji: emoji, mood_label: label, last_seen: new Date().toISOString() })
    .eq("id", me.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateProfile(
  meId: string,
  patch: {
    display_name?: string;
    avatar_emoji?: string;
    accent?: string;
    bio?: string;
    about?: Record<string, string>;
    pet_name?: string;
  }
): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const clean: Record<string, unknown> = {};
  if (patch.display_name !== undefined) clean.display_name = patch.display_name.slice(0, 40);
  if (patch.avatar_emoji !== undefined) clean.avatar_emoji = patch.avatar_emoji;
  if (patch.accent !== undefined) clean.accent = patch.accent;
  if (patch.bio !== undefined) clean.bio = patch.bio.slice(0, 500);
  if (patch.about !== undefined) clean.about = patch.about;
  if (patch.pet_name !== undefined) clean.pet_name = patch.pet_name.slice(0, 24);
  const { error } = await db.from("profiles").update(clean).eq("id", me.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/n`);
  return { ok: true };
}

export async function heartbeat(meId: string): Promise<void> {
  if (!(await hasSession(meId))) return;
  const db = supabaseAdmin();
  await db.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", meId);
}

export async function sendNudge(meId: string, toId: string, kind: "poke" | "love" | "hug"): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { error } = await db.from("nudges").insert({ nest_id: me.nest_id, from_id: me.id, to_id: toId, kind });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── partner-mediated passcode reset ───────────────────────

// requester (locked out) starts a reset — gated by the nest common password
export async function requestReset(
  slug: string,
  commonPassword: string,
  requesterId: string
): Promise<Result & { requestId?: string; partnerName?: string }> {
  const db = supabaseAdmin();
  const { data: nest } = await db.from("nests").select("id,common_password_hash").eq("slug", slug).maybeSingle();
  if (!nest) return { ok: false, error: "No nest by that name 🪹" };
  if ((nest as any).common_password_hash !== hashPasscode(commonPassword.trim())) {
    return { ok: false, error: "Wrong nest password 🙈" };
  }
  const nestId = (nest as any).id;
  const { data: requester } = await db.from("profiles").select("id").eq("id", requesterId).eq("nest_id", nestId).maybeSingle();
  if (!requester) return { ok: false, error: "That's not a member of this nest 🥺" };

  const { data: partner } = await db
    .from("profiles")
    .select("display_name")
    .eq("nest_id", nestId)
    .neq("id", requesterId)
    .maybeSingle();
  if (!partner) return { ok: false, error: "No partner yet to approve your reset 🪺" };

  // reuse an existing open request if present
  const { data: open } = await db
    .from("reset_requests")
    .select("id,status")
    .eq("nest_id", nestId)
    .eq("requester_id", requesterId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (open) return { ok: true, requestId: (open as any).id, partnerName: (partner as any).display_name };

  const { data: req, error } = await db
    .from("reset_requests")
    .insert({ nest_id: nestId, requester_id: requesterId, status: "pending" })
    .select("id")
    .single();
  if (error || !req) return { ok: false, error: "Could not start the reset 😢" };
  return { ok: true, requestId: (req as any).id, partnerName: (partner as any).display_name };
}

// partner side: pending requests in my nest (not mine)
export async function pendingResetsFor(meId: string): Promise<
  { id: string; requester_id: string; requester_name: string; status: string }[]
> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { data } = await db
    .from("reset_requests")
    .select("id,requester_id,status,profiles!reset_requests_requester_id_fkey(display_name)")
    .eq("nest_id", me.nest_id)
    .eq("status", "pending")
    .neq("requester_id", me.id);
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    requester_id: r.requester_id,
    requester_name: r.profiles?.display_name ?? "your person",
    status: r.status,
  }));
}

// partner approves with a kind note
export async function approveReset(meId: string, requestId: string, note: string): Promise<Result> {
  const me = await requireProfile(meId);
  if (!note.trim()) return { ok: false, error: "Say one sweet thing first 💕" };
  const db = supabaseAdmin();
  const { data: req } = await db.from("reset_requests").select("id,nest_id,requester_id,status").eq("id", requestId).maybeSingle();
  if (!req || (req as any).nest_id !== me.nest_id) return { ok: false, error: "Reset not found 🥺" };
  if ((req as any).requester_id === me.id) return { ok: false, error: "You can't approve your own reset 🙈" };
  const { error } = await db
    .from("reset_requests")
    .update({ status: "approved", partner_note: note.trim().slice(0, 300), approved_at: new Date().toISOString() })
    .eq("id", requestId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function declineReset(meId: string, requestId: string): Promise<Result> {
  const me = await requireProfile(meId);
  const db = supabaseAdmin();
  const { data: req } = await db.from("reset_requests").select("nest_id").eq("id", requestId).maybeSingle();
  if (!req || (req as any).nest_id !== me.nest_id) return { ok: false, error: "Reset not found 🥺" };
  await db.from("reset_requests").update({ status: "declined" }).eq("id", requestId);
  return { ok: true };
}

// requester checks if their request was approved (and reads the note)
export async function checkReset(requestId: string): Promise<{ status: string; note: string | null } | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("reset_requests").select("status,partner_note").eq("id", requestId).maybeSingle();
  return data ? { status: (data as any).status, note: (data as any).partner_note } : null;
}

// requester sets a new passcode once approved → logs in
export async function completeReset(input: {
  slug: string;
  commonPassword: string;
  requestId: string;
  newPasscode: string;
}): Promise<Result & { slug?: string }> {
  if (input.newPasscode.trim().length < 3) return { ok: false, error: "New passcode needs 3+ characters 🔑" };
  const db = supabaseAdmin();
  const { data: nest } = await db.from("nests").select("id,common_password_hash").eq("slug", input.slug).maybeSingle();
  if (!nest) return { ok: false, error: "No nest by that name 🪹" };
  if ((nest as any).common_password_hash !== hashPasscode(input.commonPassword.trim())) {
    return { ok: false, error: "Wrong nest password 🙈" };
  }
  const { data: req } = await db
    .from("reset_requests")
    .select("id,nest_id,requester_id,status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!req || (req as any).nest_id !== (nest as any).id) return { ok: false, error: "Reset not found 🥺" };
  if ((req as any).status !== "approved") return { ok: false, error: "Your partner hasn't approved yet 💗" };

  await db.from("profiles").update({ passcode_hash: hashPasscode(input.newPasscode.trim()) }).eq("id", (req as any).requester_id);
  await db.from("reset_requests").update({ status: "used" }).eq("id", input.requestId);
  await addSession((req as any).requester_id);
  await bumpNest((nest as any).id);
  return { ok: true, slug: input.slug };
}
