"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Profile } from "@/lib/types";
import { petStage } from "@/lib/moods";
import { isOnline, timeAgo } from "@/lib/format";

const LABELS: Record<string, { label: string; emoji: string }> = {
  birthday: { label: "birthday", emoji: "🎂" },
  fav_color: { label: "favorite color", emoji: "🎨" },
  fav_food: { label: "favorite food", emoji: "🍰" },
  fav_song: { label: "song on repeat", emoji: "🎵" },
  comfort: { label: "comfort movie/show", emoji: "🎬" },
  love_lang: { label: "love language", emoji: "💞" },
  dream_date: { label: "dream date", emoji: "🌙" },
  fun_fact: { label: "fun fact", emoji: "✨" },
};

export default function PartnerCard({
  partner,
  open,
  onClose,
}: {
  partner: Profile;
  open: boolean;
  onClose: () => void;
}) {
  const stage = petStage(partner.pet_xp);
  const online = isOnline(partner.last_seen);
  const about = Object.entries(partner.about ?? {}).filter(([, v]) => v?.trim());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-lav-900/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="text-center">
              <div
                className="text-6xl w-24 h-24 grid place-items-center rounded-blob mx-auto shadow-soft"
                style={{ background: partner.accent + "22" }}
              >
                {partner.avatar_emoji}
              </div>
              <h2 className="font-display text-2xl text-lav-800 mt-3">{partner.display_name}</h2>
              <div className="flex items-center justify-center gap-2 text-sm text-inkSoft mt-1">
                <span className="text-lg">{partner.mood_emoji}</span>
                <span>{partner.mood_label}</span>
                <span className="text-inkSoft/40">·</span>
                <span className={online ? "text-emerald-500" : ""}>
                  {online ? "online now 💚" : `seen ${timeAgo(partner.last_seen)}`}
                </span>
              </div>
            </div>

            {partner.bio?.trim() && (
              <p className="text-center text-ink mt-4 bg-lav-50 rounded-2xl p-3 italic">
                “{partner.bio}”
              </p>
            )}

            {about.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {about.map(([k, v]) => {
                  const meta = LABELS[k] ?? { label: k, emoji: "🌸" };
                  return (
                    <div key={k} className="flex items-start gap-2 text-sm">
                      <span>{meta.emoji}</span>
                      <span className="text-inkSoft w-28 shrink-0">{meta.label}</span>
                      <span className="text-ink font-medium">{v}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-lav-100 flex items-center justify-center gap-2 text-sm text-inkSoft">
              <span className="text-xl">{stage.emoji}</span>
              <span>
                {partner.pet_name} the {stage.title}
              </span>
            </div>

            <button onClick={onClose} className="btn-ghost w-full mt-5">close 💜</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
