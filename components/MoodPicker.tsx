"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOODS } from "@/lib/moods";
import { setMood } from "@/app/actions";
import type { Profile } from "@/lib/types";

export default function MoodPicker({ me }: { me: Profile }) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const [optimistic, setOptimistic] = useState({ emoji: me.mood_emoji, label: me.mood_label });

  function choose(emoji: string, label: string) {
    setOptimistic({ emoji, label });
    setOpen(false);
    start(() => void setMood(me.id, emoji, label));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-white/70 hover:bg-white border border-white px-2.5 py-1.5 transition"
        title="set your mood"
      >
        <span className="text-xl">{optimistic.emoji}</span>
        <span className="text-xs text-inkSoft hidden sm:block">{optimistic.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-12 z-40 card p-3 w-64"
            >
              <p className="text-xs font-semibold text-inkSoft mb-2 ml-1">how do you feel? 💭</p>
              <div className="grid grid-cols-4 gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => choose(m.emoji, m.label)}
                    className="flex flex-col items-center gap-0.5 rounded-xl py-2 hover:bg-lav-100 transition"
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] text-inkSoft leading-tight text-center">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
