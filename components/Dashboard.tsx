"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { logoutEverywhere } from "@/app/actions";

type NestCard = {
  slug: string;
  nestName: string;
  nestId: string;
  profileId: string;
  display_name: string;
  avatar_emoji: string;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export default function Dashboard({ nests }: { nests: NestCard[] }) {
  const router = useRouter();
  const [joinName, setJoinName] = useState("");
  const [, startLogout] = useTransition();

  function goJoin() {
    const slug = slugify(joinName);
    if (slug.length >= 2) router.push(`/n/${slug}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="text-center mb-7 mt-4">
        <div className="text-6xl mb-2 animate-float inline-block">🪺💜</div>
        <h1 className="font-display text-4xl text-lav-800">your cozy nests</h1>
        <p className="text-inkSoft mt-1">little worlds for two — make as many as you like 🐣</p>
      </div>

      {/* your nests */}
      {nests.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {nests.map((n) => (
            <Link key={n.profileId} href={`/n/${n.slug}`}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="card p-4 flex items-center gap-3 cursor-pointer h-full"
              >
                <div className="text-4xl w-14 h-14 grid place-items-center rounded-blob bg-lav-100 shrink-0">
                  {n.avatar_emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xl text-lav-800 truncate">{n.nestName}</div>
                  <div className="text-xs text-inkSoft truncate">
                    /n/{n.slug} · you're <span className="font-semibold">{n.display_name}</span>
                  </div>
                </div>
                <span className="ml-auto text-2xl">→</span>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center mb-6">
          <div className="text-5xl mb-2">🫧</div>
          <p className="font-display text-xl text-lav-800">no nests yet</p>
          <p className="text-inkSoft text-sm mt-1">make one and invite your person 💌</p>
        </div>
      )}

      {/* actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/create" className="card p-5 hover:scale-[1.01] transition text-center">
          <div className="text-3xl mb-1">✨</div>
          <div className="font-display text-lg text-lav-800">create a nest</div>
          <div className="text-xs text-inkSoft">start a fresh little world</div>
        </Link>

        <div className="card p-5">
          <div className="text-center">
            <div className="text-3xl mb-1">🚪</div>
            <div className="font-display text-lg text-lav-800">enter a nest</div>
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goJoin()}
              placeholder="nest name…"
              className="input-cute flex-1 py-2 text-sm"
            />
            <button onClick={goJoin} className="btn-cute px-4 py-2 text-sm">go</button>
          </div>
        </div>
      </div>

      {nests.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => startLogout(() => logoutEverywhere().then(() => router.refresh()))}
            className="text-xs text-inkSoft/70 hover:text-rose-400 transition"
          >
            log out of all nests on this device
          </button>
        </div>
      )}
    </motion.div>
  );
}
