# 🐰💜 our little chat

A cozy, *aggressively cute* real-time chat for **exactly two people**. Lavender &
periwinkle everything, emojis, GIFs, stickers, reactions, typing dots, screen-shake
pokes, mood statuses, an "all about you" profile, and a little pet that grows every
time you send a message.

Built with **Next.js (App Router) + Supabase (Postgres + Realtime) + Tailwind**, made
to live on **Vercel free + Supabase free**.

---

## ✨ Features

- 💬 **Real-time messaging** (Supabase Realtime) — text, emoji, big stickers, GIFs
- 🎞️ **GIF search** via KLIPY (key stays server-side)
- 😀 **Emoji picker** with search + "send as big sticker" mode
- ❤️ **Reactions** on any message (Discord-style)
- ↩️ **Replies**, ✏️ edit, 🗑️ delete your own messages
- 🫧 **Typing indicator** — "*name* is typing…" with bouncing dots
- 👉🤗💖 **Pokes / hugs / love** — buzzes & shakes the other person's screen with floating hearts
- 😊 **Mood status** per person (shown in the header, set in one tap)
- 🐣 **Pet widget** — evolves egg → 🐉 as you chat (1 xp per message)
- 📝 **Profile / "all about me"** — bio, favorite things, birthday, love language, avatar, accent color
- 🔒 **Two-person lock** — only two profiles can ever be created

---

## 🚀 Setup (about 10 minutes)

### 1. Install
```bash
npm install
```

### 2. Create a Supabase project
- Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
- Open **SQL Editor**, paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and **Run**.
- Go to **Settings → API** and copy:
  - Project URL
  - `anon` public key
  - `service_role` secret key

### 3. Get a KLIPY (GIF) key — optional but cute
- [KLIPY developers](https://klipy.com/developers) → grab a key from the Partner Panel (Tenor's public API is gone).
- Skip this and GIFs simply show a friendly "add a key" note; everything else works.

### 4. Environment variables
```bash
cp .env.local.example .env.local
```
Fill it in. For `SESSION_SECRET` generate a random string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run it
```bash
npm run dev
```
Open http://localhost:3000 — first visitor taps **First time ✨** and makes a profile,
the second person does the same. That's it, the nest is full. 🪺

---

## ☁️ Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the same env vars from `.env.local` in **Project → Settings → Environment Variables**
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `KLIPY_API_KEY`, `SESSION_SECRET`).
4. Deploy. Share the URL with your person. 💌

---

## 🧱 How it works

- **Writes** (send, react, edit, mood, profile) go through Next.js **server actions**, which
  validate the session cookie before touching the DB. They use the Supabase **anon** key by
  default (RLS has scoped write policies), or the **service_role** secret if you set
  `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — more secure).
- **Reads / live updates** use the browser **anon** client + Supabase **Realtime**
  (postgres changes for messages/reactions/profiles, broadcast for typing & pokes,
  presence for online status).
- **Login** is a simple per-person name + passcode (sha256-hashed). The whole site is a
  private space for two — there's no public sign-up beyond the two seats.

### Security note
This is a hobby app for two trusted people. The public Supabase URL + anon key are baked in
as fallbacks (they ship in the browser anyway) and RLS allows reads + scoped writes — so
anyone who finds the URL could, in theory, hit the API directly. Fine for an obscure private
corner. To harden: set `SUPABASE_SERVICE_ROLE_KEY` + a strong `SESSION_SECRET`, tighten the
write policies in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
or move to Supabase Auth. Good enough for a couple's secret nest. 💜

---

## 🎨 Make it yours

- Palette / animations: [`tailwind.config.ts`](tailwind.config.ts) + [`app/globals.css`](app/globals.css)
- Moods, avatars, pet stages: [`lib/moods.ts`](lib/moods.ts)
- Emoji set: [`lib/emoji.ts`](lib/emoji.ts)
- "About me" prompts: [`components/ProfileEditor.tsx`](components/ProfileEditor.tsx)

Enjoy your tiny world. 🐰🐻
