"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loginOrCreate } from "@/app/actions";
import { AVATARS } from "@/lib/moods";

type MiniProfile = { id: string; name: string; display_name: string; avatar_emoji: string; accent: string };

export default function LoginForm({ profiles }: { profiles: MiniProfile[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"pick" | "new">(profiles.length > 0 ? "pick" : "new");
  const [selected, setSelected] = useState<MiniProfile | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🐰");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canCreate = profiles.length < 2;

  function submit() {
    setError(null);
    const payload =
      mode === "pick" && selected
        ? { name: selected.name, passcode }
        : { name, passcode, display_name: displayName || name, avatar_emoji: avatar };
    if (!payload.name) {
      setError("Pick who you are first 💜");
      return;
    }
    start(async () => {
      const res = await loginOrCreate(payload);
      if (res.ok) router.replace("/chat");
      else setError(res.error);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="card w-full max-w-md p-7"
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-2 animate-float inline-block">🐰💜🐻</div>
        <h1 className="font-display text-3xl text-lav-800">our little chat</h1>
        <p className="text-inkSoft mt-1">a cozy place for just the two of us</p>
      </div>

      {/* tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-lav-100 rounded-full">
        <button
          onClick={() => { setMode("pick"); setError(null); }}
          disabled={profiles.length === 0}
          className={`flex-1 rounded-full py-2 font-semibold transition disabled:opacity-40 ${
            mode === "pick" ? "bg-white shadow-soft text-lav-800" : "text-inkSoft"
          }`}
        >
          I'm back 👋
        </button>
        <button
          onClick={() => { setMode("new"); setError(null); }}
          disabled={!canCreate}
          className={`flex-1 rounded-full py-2 font-semibold transition disabled:opacity-40 ${
            mode === "new" ? "bg-white shadow-soft text-lav-800" : "text-inkSoft"
          }`}
        >
          First time ✨
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "pick" ? (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`rounded-bubble p-4 border-2 transition text-center ${
                    selected?.id === p.id
                      ? "border-lav-400 bg-lav-50 scale-[1.02]"
                      : "border-lav-100 bg-white/60 hover:border-lav-300"
                  }`}
                >
                  <div className="text-4xl mb-1">{p.avatar_emoji}</div>
                  <div className="font-semibold text-ink truncate">{p.display_name}</div>
                </button>
              ))}
              {profiles.length === 1 && (
                <div className="rounded-bubble p-4 border-2 border-dashed border-lav-200 grid place-items-center text-inkSoft text-sm">
                  waiting for your
                  <br /> other half 🪺
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {!canCreate && (
              <p className="text-center text-sm text-inkSoft bg-lav-50 rounded-2xl p-3">
                Both spots are taken already 🪺 — switch to "I'm back".
              </p>
            )}
            <div>
              <label className="text-sm font-semibold text-inkSoft ml-1">your display name</label>
              <input
                className="input-cute w-full mt-1"
                placeholder="e.g. Bubu"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-inkSoft ml-1">login name (secret-ish)</label>
              <input
                className="input-cute w-full mt-1"
                placeholder="e.g. bubu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-inkSoft ml-1">pick your face</label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-28 overflow-y-auto no-scrollbar p-1">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    disabled={!canCreate}
                    className={`text-2xl rounded-xl w-10 h-10 grid place-items-center transition ${
                      avatar === a ? "bg-lav-200 scale-110" : "hover:bg-lav-100"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* passcode always */}
      <div className="mt-4">
        <label className="text-sm font-semibold text-inkSoft ml-1">your secret passcode 🔑</label>
        <input
          type="password"
          className="input-cute w-full mt-1"
          placeholder="shhh…"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-rose-500 mt-3 font-medium"
        >
          {error}
        </motion.p>
      )}

      <button onClick={submit} disabled={pending} className="btn-cute w-full mt-5 py-3 text-lg">
        {pending ? "opening the door…" : mode === "new" ? "make my nest 🪺" : "come in 💜"}
      </button>

      <p className="text-center text-xs text-inkSoft/70 mt-4">
        only two people can ever live here 🐣🐤
      </p>
    </motion.div>
  );
}
