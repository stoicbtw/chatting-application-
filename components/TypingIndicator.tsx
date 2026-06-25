"use client";

import { motion } from "framer-motion";

export default function TypingIndicator({ name, avatar }: { name: string; avatar: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2 mt-2"
    >
      <div className="text-xl w-7 h-7 grid place-items-center rounded-full bg-white/70">{avatar}</div>
      <div className="bg-white rounded-bubble rounded-bl-md shadow-soft border border-white px-4 py-3 flex items-center gap-1">
        <Dot d={0} />
        <Dot d={0.15} />
        <Dot d={0.3} />
        <span className="text-xs text-inkSoft ml-1">{name} is typing…</span>
      </div>
    </motion.div>
  );
}

function Dot({ d }: { d: number }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-lav-400 animate-bouncedot"
      style={{ animationDelay: `${d}s` }}
    />
  );
}
