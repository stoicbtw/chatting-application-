"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { Profile } from "@/lib/types";
import { AVATARS, MOODS } from "@/lib/moods";
import { updateProfile, setMood } from "@/app/actions";

const ACCENTS = ["#8C9EFF", "#B197FC", "#FF8FB1", "#FFB877", "#6FD0C0", "#F7A8D8", "#7BC4FF", "#A0E57C"];

// preset "about me" prompts — cute things to share
const ABOUT_FIELDS: { key: string; label: string; placeholder: string; emoji: string }[] = [
  { key: "birthday", label: "birthday", placeholder: "month / day", emoji: "🎂" },
  { key: "fav_color", label: "favorite color", placeholder: "lavender obvs", emoji: "🎨" },
  { key: "fav_food", label: "favorite food", placeholder: "strawberry cake", emoji: "🍰" },
  { key: "fav_song", label: "song on repeat", placeholder: "…", emoji: "🎵" },
  { key: "comfort", label: "comfort movie/show", placeholder: "…", emoji: "🎬" },
  { key: "love_lang", label: "love language", placeholder: "quality time", emoji: "💞" },
  { key: "dream_date", label: "dream date", placeholder: "picnic under stars", emoji: "🌙" },
  { key: "fun_fact", label: "a fun fact about me", placeholder: "i can wiggle my ears", emoji: "✨" },
];

export default function ProfileEditor({ profile, slug }: { profile: Profile; slug: string }) {
  const [avatar, setAvatar] = useState(profile.avatar_emoji);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [accent, setAccent] = useState(profile.accent);
  const [bio, setBio] = useState(profile.bio);
  const [petName, setPetName] = useState(profile.pet_name);
  const [about, setAbout] = useState<Record<string, string>>(profile.about ?? {});
  const [mood, setMoodState] = useState({ emoji: profile.mood_emoji, label: profile.mood_label });
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function setField(k: string, v: string) {
    setAbout((a) => ({ ...a, [k]: v }));
  }

  function save() {
    setSaved(false);
    start(async () => {
      // strip empty about fields
      const cleanAbout: Record<string, string> = {};
      for (const [k, v] of Object.entries(about)) if (v.trim()) cleanAbout[k] = v.trim();
      await updateProfile(profile.id, {
        display_name: displayName,
        avatar_emoji: avatar,
        accent,
        bio,
        about: cleanAbout,
        pet_name: petName,
      });
      await setMood(profile.id, mood.emoji, mood.label);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl"
    >
      {/* top bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <Link href={`/n/${slug}`} className="btn-ghost text-sm">← back to chat</Link>
        <h1 className="font-display text-2xl text-lav-800">all about you 💜</h1>
        <div className="w-20" />
      </div>

      {/* identity card */}
      <div className="card p-5 mb-3">
        <div className="flex items-center gap-4">
          <div
            className="text-5xl w-20 h-20 grid place-items-center rounded-blob shadow-soft"
            style={{ background: accent + "22" }}
          >
            {avatar}
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-inkSoft ml-1">display name</label>
            <input className="input-cute w-full mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
        </div>

        <p className="text-xs font-semibold text-inkSoft mt-4 mb-1 ml-1">pick your face</p>
        <div className="flex flex-wrap gap-1">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-2xl w-10 h-10 rounded-xl grid place-items-center transition ${
                avatar === a ? "bg-lav-200 scale-110" : "hover:bg-lav-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-inkSoft mt-4 mb-1 ml-1">your accent color</p>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              className={`w-8 h-8 rounded-full transition ${accent === c ? "ring-4 ring-offset-2 ring-lav-300 scale-110" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* mood */}
      <div className="card p-5 mb-3">
        <p className="font-display text-lg text-lav-800 mb-2">today i'm feeling…</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMoodState({ emoji: m.emoji, label: m.label })}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2 transition ${
                mood.label === m.label ? "bg-lav-100 scale-105" : "hover:bg-lav-50"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[9px] text-inkSoft text-center leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* bio */}
      <div className="card p-5 mb-3">
        <p className="font-display text-lg text-lav-800 mb-2">a little note about me 📝</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="write anything… what makes you happy, what you're up to lately 🌷"
          className="input-cute w-full resize-none"
        />
        <p className="text-[10px] text-inkSoft/60 text-right mt-1">{bio.length}/500</p>
      </div>

      {/* about fields */}
      <div className="card p-5 mb-3">
        <p className="font-display text-lg text-lav-800 mb-3">my favorite things 🌈</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {ABOUT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-inkSoft ml-1 flex items-center gap-1">
                <span>{f.emoji}</span> {f.label}
              </label>
              <input
                className="input-cute w-full mt-1 text-sm"
                placeholder={f.placeholder}
                value={about[f.key] ?? ""}
                onChange={(e) => setField(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* pet */}
      <div className="card p-5 mb-3">
        <p className="font-display text-lg text-lav-800 mb-2">name your pet 🐣</p>
        <input className="input-cute w-full" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Mochi" />
        <p className="text-xs text-inkSoft mt-1 ml-1">it grows a little every time you send a message 💬</p>
      </div>

      {/* save */}
      <div className="sticky bottom-3 flex items-center gap-3">
        <button onClick={save} disabled={pending} className="btn-cute flex-1 py-3 text-lg">
          {pending ? "saving…" : saved ? "saved! 🥰" : "save my cuteness 💾"}
        </button>
      </div>

      <div className="h-6" />
    </motion.div>
  );
}
