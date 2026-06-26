-- ╔══════════════════════════════════════════════════════════╗
-- ║  cute chat — multi-nest upgrade                            ║
-- ║  many private "nests" (2 people each). Each nest has a     ║
-- ║  common password; each member has a personal passcode.    ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── nests ─────────────────────────────────────────────────
create table if not exists nests (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,           -- url handle, e.g. "cuddles"
  name                 text not null,                  -- display name
  common_password_hash text not null,                  -- sha256(common pw + secret)
  member_cap           int  not null default 2,
  created_at           timestamptz not null default now()
);

-- ── profiles now belong to a nest ─────────────────────────
alter table profiles add column if not exists nest_id uuid references nests(id) on delete cascade;
alter table profiles drop constraint if exists profiles_name_key;            -- was globally unique
do $$ begin
  alter table profiles add constraint profiles_nest_name_key unique (nest_id, name);
exception when duplicate_table then null; when duplicate_object then null; end $$;
create index if not exists profiles_nest_idx on profiles (nest_id);

-- ── scope content to a nest ───────────────────────────────
alter table messages  add column if not exists nest_id uuid references nests(id) on delete cascade;
alter table reactions add column if not exists nest_id uuid references nests(id) on delete cascade;
alter table nudges    add column if not exists nest_id uuid references nests(id) on delete cascade;
create index if not exists messages_nest_idx  on messages  (nest_id, created_at);
create index if not exists reactions_nest_idx on reactions (nest_id);
create index if not exists nudges_nest_idx    on nudges    (nest_id);

-- ── realtime + RLS for nests ──────────────────────────────
do $$ begin
  alter publication supabase_realtime add table nests;
exception when duplicate_object then null; end $$;

alter table nests enable row level security;
create policy "read nests"      on nests for select using (true);
create policy "write nests ins" on nests for insert with check (true);
