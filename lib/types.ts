export type Nest = {
  id: string;
  slug: string;
  name: string;
  member_cap: number;
  created_at: string;
};

export type Profile = {
  id: string;
  nest_id: string;
  name: string;
  display_name: string;
  avatar_emoji: string;
  accent: string;
  mood_emoji: string;
  mood_label: string;
  bio: string;
  about: Record<string, string>;
  pet_name: string;
  pet_xp: number;
  last_seen: string;
  created_at: string;
};

export type Reaction = {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
};

export type ResetRequest = {
  id: string;
  nest_id: string;
  requester_id: string;
  status: "pending" | "approved" | "used" | "declined";
  partner_note: string | null;
  created_at: string;
  approved_at: string | null;
};

export type Message = {
  id: string;
  nest_id: string;
  sender_id: string;
  kind: "text" | "gif" | "sticker";
  content: string;
  gif_url: string | null;
  reply_to: string | null;
  edited: boolean;
  created_at: string;
  reactions?: Reaction[];
};

export type Nudge = {
  id: string;
  from_id: string;
  to_id: string;
  kind: "poke" | "love" | "hug";
  created_at: string;
};

// columns safe to expose to the browser (never passcode_hash)
export const PROFILE_COLS =
  "id,nest_id,name,display_name,avatar_emoji,accent,mood_emoji,mood_label,bio,about,pet_name,pet_xp,last_seen,created_at";
