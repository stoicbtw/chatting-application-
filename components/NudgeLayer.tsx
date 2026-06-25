"use client";

import { useEffect, useState } from "react";
import type { NudgeKind } from "@/components/ChatRoom";

const EMOJI: Record<NudgeKind, string[]> = {
  poke: ["👉", "✨", "💢"],
  love: ["💖", "💕", "💗", "💓", "❤️", "🥰"],
  hug: ["🤗", "🫂", "💛", "🧸"],
};

const LABEL: Record<NudgeKind, string> = {
  poke: "poke!",
  love: "love you 💜",
  hug: "warm hug 🤗",
};

type Burst = { id: number; kind: NudgeKind; bits: { x: number; d: number; e: string; r: number }[] };

export default function NudgeLayer({ nudge }: { nudge: { kind: NudgeKind; tick: number } | null }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [banner, setBanner] = useState<{ id: number; kind: NudgeKind } | null>(null);

  useEffect(() => {
    if (!nudge) return;
    const id = nudge.tick;
    const palette = EMOJI[nudge.kind];
    const bits = Array.from({ length: nudge.kind === "poke" ? 8 : 16 }, (_, i) => ({
      x: 8 + ((i * 37) % 84) + (i % 3) * 3, // spread across width, deterministic
      d: (i % 5) * 0.08,
      e: palette[i % palette.length],
      r: ((i * 53) % 40) - 20,
    }));
    setBursts((b) => [...b, { id, kind: nudge.kind, bits }]);
    setBanner({ id, kind: nudge.kind });

    const t1 = setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600);
    const t2 = setTimeout(() => setBanner((cur) => (cur?.id === id ? null : cur)), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [nudge?.tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((b) =>
        b.bits.map((bit, i) => (
          <span
            key={b.id + "-" + i}
            className="heart-pop absolute bottom-24 text-3xl"
            style={{ left: `${bit.x}%`, animationDelay: `${bit.d}s`, transform: `rotate(${bit.r}deg)` }}
          >
            {bit.e}
          </span>
        ))
      )}

      {banner && (
        <div className="absolute inset-x-0 top-1/3 grid place-items-center">
          <div className="animate-heartbeat text-5xl font-display font-bold text-lav-700 drop-shadow-[0_4px_12px_rgba(123,108,240,0.4)]">
            {LABEL[banner.kind]}
          </div>
        </div>
      )}
    </div>
  );
}
