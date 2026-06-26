"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { createNest } from "@/app/actions";
import { AVATARS } from "@/lib/moods";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export default function CreateNestForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [nestName, setNestName] = useState("");
  const [handle, setHandle] = useState("");
  const [commonPassword, setCommonPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🐰");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(handle || nestName);

  function submit() {
    setError(null);
    start(async () => {
      const res = await createNest({
        slug,
        name: nestName,
        commonPassword,
        displayName,
        avatarEmoji: avatar,
        passcode,
      });
      if (res.ok && res.slug) router.replace(`/n/${res.slug}`);
      else setError(res.ok ? "Something went wrong" : res.error);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="card w-full max-w-md p-7"
    >
      <Link href="/" className="text-sm text-inkSoft hover:text-lav-700">← all nests</Link>
      <div className="text-center my-4">
        <div className="text-5xl mb-1 animate-float inline-block">🪺✨</div>
        <h1 className="font-display text-3xl text-lav-800">make a nest</h1>
        <p className="text-inkSoft text-sm">a private world for you two</p>
      </div>

      <div className="space-y-3">
        <Field label="nest name 🏷️">
          <input className="input-cute w-full" placeholder="e.g. Bubu & Dudu" value={nestName} onChange={(e) => setNestName(e.target.value)} />
        </Field>

        <Field label="nest handle (its link) 🔗">
          <div className="flex items-center gap-1">
            <span className="text-inkSoft text-sm">/n/</span>
            <input
              className="input-cute flex-1"
              placeholder="bubu-dudu"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          {slug && <p className="text-[11px] text-inkSoft mt-1 ml-1">your link: /n/{slug}</p>}
        </Field>

        <Field label="nest password (you BOTH share this) 🔑">
          <input
            type="password"
            className="input-cute w-full"
            placeholder="the secret word to your nest"
            value={commonPassword}
            onChange={(e) => setCommonPassword(e.target.value)}
          />
        </Field>

        <div className="border-t border-lav-100 my-2" />
        <p className="text-sm font-semibold text-lav-700 ml-1">now… you 💁</p>

        <Field label="your name">
          <input className="input-cute w-full" placeholder="e.g. Bubu" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>

        <Field label="your face">
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar p-1">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl w-9 h-9 rounded-xl grid place-items-center transition ${
                  avatar === a ? "bg-lav-200 scale-110" : "hover:bg-lav-100"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>

        <Field label="your personal passcode 🔐">
          <input
            type="password"
            className="input-cute w-full"
            placeholder="only you know this"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </Field>
      </div>

      {error && <p className="text-center text-sm text-rose-500 mt-3 font-medium">{error}</p>}

      <button onClick={submit} disabled={pending} className="btn-cute w-full mt-5 py-3 text-lg">
        {pending ? "building your nest…" : "build our nest 🪺"}
      </button>

      <p className="text-center text-xs text-inkSoft/70 mt-3">
        share the nest name + nest password with your person so they can join 💌
      </p>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-inkSoft ml-1">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
