-- ╔══════════════════════════════════════════════════════════╗
-- ║  cute chat — partner-mediated passcode reset              ║
-- ║  + auto-destruct of cold nests (inactive 30 days)        ║
-- ╚══════════════════════════════════════════════════════════╝

-- track nest activity (any login / message bumps it)
alter table nests add column if not exists last_active timestamptz not null default now();
create index if not exists nests_last_active_idx on nests (last_active);

-- a member forgot their passcode; partner must approve with a kind note
create table if not exists reset_requests (
  id           uuid primary key default gen_random_uuid(),
  nest_id      uuid not null references nests(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  status       text not null default 'pending',   -- pending | approved | used | declined
  partner_note text,                                -- the sweet thing the partner said
  created_at   timestamptz not null default now(),
  approved_at  timestamptz
);
create index if not exists reset_requests_nest_idx on reset_requests (nest_id, status);

do $$ begin
  alter publication supabase_realtime add table reset_requests;
exception when duplicate_object then null; end $$;

alter table reset_requests enable row level security;
create policy "read resets"  on reset_requests for select using (true);
create policy "ins resets"   on reset_requests for insert with check (true);
create policy "upd resets"   on reset_requests for update using (true) with check (true);
