"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { Nest, Profile } from "@/lib/types";
import type { NudgeKind } from "@/components/ChatRoom";
import { logoutNest } from "@/app/actions";
import MoodPicker from "@/components/MoodPicker";
import PartnerCard from "@/components/PartnerCard";

export default function Header({
  me,
  partner,
  nest,
  partnerOnline,
  onNudge,
}: {
  me: Profile;
  partner: Profile | null;
  nest: Nest;
  partnerOnline: boolean;
  onNudge: (k: NudgeKind) => void;
}) {
  const [, startLogout] = useTransition();
  const [showPartner, setShowPartner] = useState(false);

  return (
    <header className="sticky top-0 z-20 px-3 pt-3">
      {partner && <PartnerCard partner={partner} open={showPartner} onClose={() => setShowPartner(false)} />}
      <div className="card px-3.5 py-2.5 flex items-center gap-3">
        {/* home / switch nests */}
        <Link
          href="/"
          title={`${nest.name} — switch nests`}
          className="shrink-0 text-2xl w-10 h-10 grid place-items-center rounded-full bg-white/70 hover:bg-white border border-white transition"
        >
          🪺
        </Link>

        {/* partner */}
        {partner ? (
          <button onClick={() => setShowPartner(true)} className="flex items-center gap-3 min-w-0 text-left rounded-full hover:bg-white/40 pr-2 transition">
            <div className="relative">
              <div className="text-3xl w-11 h-11 grid place-items-center rounded-full bg-lav-100 shadow-soft">
                {partner.avatar_emoji}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  partnerOnline ? "bg-emerald-400" : "bg-gray-300"
                }`}
                title={partnerOnline ? "online" : "away"}
              />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg leading-tight text-lav-800 truncate">
                {partner.display_name}
              </div>
              <div className="text-xs text-inkSoft flex items-center gap-1 truncate">
                <span className="text-sm">{partner.mood_emoji}</span>
                <span className="truncate">
                  {partnerOnline ? partner.mood_label : "feeling " + partner.mood_label}
                </span>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-inkSoft">
            <span className="text-2xl animate-float">🪺</span>
            <span className="text-sm">waiting for your other half…</span>
          </div>
        )}

        <div className="flex-1" />

        {/* nudge buttons */}
        {partner && (
          <div className="flex items-center gap-1">
            <NudgeBtn label="poke" emoji="👉" onClick={() => onNudge("poke")} />
            <NudgeBtn label="hug" emoji="🤗" onClick={() => onNudge("hug")} />
            <NudgeBtn label="love" emoji="💖" onClick={() => onNudge("love")} />
          </div>
        )}

        {/* my mood */}
        <MoodPicker me={me} />

        {/* profile + logout */}
        <Link
          href={`/n/${nest.slug}/profile`}
          className="text-2xl w-10 h-10 grid place-items-center rounded-full bg-white/70 hover:bg-white border border-white transition"
          title="your profile"
        >
          {me.avatar_emoji}
        </Link>
        <button
          onClick={() => startLogout(async () => { await logoutNest(me.id); window.location.href = "/"; })}
          className="text-inkSoft hover:text-rose-400 transition w-9 h-9 grid place-items-center rounded-full hover:bg-white/70"
          title="log out of this nest"
        >
          ⎋
        </button>
      </div>
    </header>
  );
}

function NudgeBtn({ label, emoji, onClick }: { label: string; emoji: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.8, rotate: -12 }}
      whileHover={{ scale: 1.15 }}
      onClick={onClick}
      title={label}
      className="text-xl w-9 h-9 grid place-items-center rounded-full hover:bg-lav-100 transition"
    >
      {emoji}
    </motion.button>
  );
}
