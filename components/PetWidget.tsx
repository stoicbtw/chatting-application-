"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile } from "@/lib/types";
import { petStage } from "@/lib/moods";

export default function PetWidget({ me, partner }: { me: Profile; partner: Profile | null }) {
  const [open, setOpen] = useState(false);
  const [pats, setPats] = useState(0);
  const stage = petStage(me.pet_xp);

  const progress = stage.next
    ? Math.min(100, Math.round(((me.pet_xp - stage.at) / (stage.next.at - stage.at)) * 100))
    : 100;

  function pat() {
    setPats((p) => p + 1);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
  }

  return (
    <div className="fixed bottom-24 left-3 sm:left-[max(0.75rem,calc(50%-20rem-3.5rem))] z-30">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="card p-3 mb-2 w-52"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-lav-800">{me.pet_name}</span>
              <span className="text-[10px] chip">{stage.title}</span>
            </div>

            <button onClick={pat} className="w-full grid place-items-center py-2 select-none" title="pat your pet">
              <motion.span
                key={pats}
                animate={{ scale: [1, 1.25, 0.95, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 0.5 }}
                className="text-6xl"
              >
                {stage.emoji}
              </motion.span>
            </button>

            <div className="h-2 rounded-full bg-lav-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-lav-400 to-lav-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-inkSoft text-center mt-1">
              {stage.next ? `${me.pet_xp} / ${stage.next.at} xp → ${stage.next.emoji}` : "fully grown! 🌟"}
            </p>
            <p className="text-[10px] text-inkSoft/70 text-center mt-1">
              grows +1 each message you send 💬
            </p>

            {partner && (
              <div className="mt-2 pt-2 border-t border-lav-100 flex items-center justify-center gap-2 text-xs text-inkSoft">
                <span>{partner.display_name}'s pet:</span>
                <span className="text-lg">{petStage(partner.pet_xp).emoji}</span>
              </div>
            )}

            {pats > 0 && (
              <p className="text-[10px] text-center text-lav-500 mt-1">patted {pats}× 🥰</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-white/80 backdrop-blur shadow-cute border border-white grid place-items-center text-3xl animate-float"
        title={`${me.pet_name} the ${stage.title}`}
      >
        {stage.emoji}
      </motion.button>
    </div>
  );
}
