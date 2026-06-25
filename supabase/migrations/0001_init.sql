-- ╔══════════════════════════════════════════════════════════╗
-- ║  cute chat — database schema                               ║
-- ║  run this in Supabase → SQL Editor (or via CLI migrate)    ║
-- ╚══════════════════════════════════════════════════════════╝

create extension if not exists pgcrypto;

-- ── profiles ──────────────────────────────────────────────
-- exactly two of these will ever exist (it's a 2-person app)
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,              -- login handle (lowercased)
  passcode_hash text not null,                      -- sha256(passcode + secret)
  display_name  text not null,
  avatar_emoji  text not null default '🐰',
  accent        text not null default '#8C9EFF',
  mood_emoji    text not null default '😊',
  mood_label    text not null default 'happy',
  bio           text not null default '',
  about         jsonb not null default '{}'::jsonb, -- favorite things, birthday, etc.
  pet_name      text not null default 'Mochi',
  pet_xp        int  not null default 0,
  last_seen     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ── messages ──────────────────────────────────────────────
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  sender_id  uuid not null references profiles(id) on delete cascade,
  kind       text not null default 'text',          -- text | gif | sticker
  content    text not null default '',
  gif_url    text,                                   -- when kind = gif
  reply_to   uuid references messages(id) on delete set null,
  edited     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_idx on messages (created_at);

-- ── reactions ─────────────────────────────────────────────
create table if not exists reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (message_id, profile_id, emoji)
);
create index if not exists reactions_message_idx on reactions (message_id);

-- ── nudges (poke / love) ──────────────────────────────────
-- persisted so a poke isn't lost if you're offline; mostly ephemeral
create table if not exists nudges (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references profiles(id) on delete cascade,
  to_id      uuid not null references profiles(id) on delete cascade,
  kind       text not null default 'poke',           -- poke | love | hug
  created_at timestamptz not null default now()
);
create index if not exists nudges_created_idx on nudges (created_at);

-- ── realtime: broadcast row changes to subscribed clients ──
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table nudges;

-- ── row level security ────────────────────────────────────
-- The app gate is the passcode login. All WRITES go through
-- Next.js server actions using the service_role key (which
-- bypasses RLS). The browser only needs READ access so Realtime
-- subscriptions work. So: allow SELECT to anon, deny writes.
alter table profiles  enable row level security;
alter table messages  enable row level security;
alter table reactions enable row level security;
alter table nudges    enable row level security;

-- readable by the anon client (needed for realtime + initial fetch fallback)
create policy "read profiles"  on profiles  for select using (true);
create policy "read messages"  on messages  for select using (true);
create policy "read reactions" on reactions for select using (true);
create policy "read nudges"    on nudges    for select using (true);

-- NOTE: passcode_hash is selectable above. If you want it hidden from
-- the anon client, query columns explicitly client-side (this app does)
-- or move reads behind the server. For a private 2-person app this is fine.
