"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message, Profile, Reaction } from "@/lib/types";
import { clockTime } from "@/lib/format";
import { QUICK_REACTIONS } from "@/lib/emoji";
import { toggleReaction, editMessage, deleteMessage } from "@/app/actions";

export default function MessageBubble({
  message,
  mine,
  sender,
  grouped,
  me,
  repliedTo,
  onReply,
}: {
  message: Message;
  mine: boolean;
  sender?: Profile;
  grouped: boolean;
  me: Profile;
  repliedTo?: Message | null;
  onReply: () => void;
}) {
  const [showReact, setShowReact] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [, start] = useTransition();

  const grouped_rx = groupReactions(message.reactions ?? []);
  const isSticker = message.kind === "sticker";

  function react(emoji: string) {
    setShowReact(false);
    start(() => void toggleReaction(message.id, emoji));
  }

  function saveEdit() {
    setEditing(false);
    if (draft.trim() && draft !== message.content) start(() => void editMessage(message.id, draft.trim()));
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`group flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2.5"}`}
    >
      <div className={`flex items-end gap-2 max-w-[82%] ${mine ? "flex-row-reverse" : ""}`}>
        {/* avatar (only first of a group, only partner side keeps it visible) */}
        <div className={`w-7 shrink-0 ${grouped ? "opacity-0" : ""}`}>
          <div className="text-xl w-7 h-7 grid place-items-center rounded-full bg-white/70">
            {sender?.avatar_emoji ?? "🐰"}
          </div>
        </div>

        <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
          {/* reply quote */}
          {repliedTo && (
            <div
              className={`text-xs mb-1 px-3 py-1 rounded-xl max-w-full truncate border ${
                mine ? "bg-lav-100/70 border-lav-200" : "bg-white/70 border-white"
              } text-inkSoft`}
            >
              ↩︎ {repliedTo.kind === "gif" ? "a gif" : repliedTo.content.slice(0, 60) || "…"}
            </div>
          )}

          <div className="relative flex items-center gap-1">
            {/* hover actions */}
            <div
              className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition ${
                mine ? "order-1" : "order-2"
              }`}
            >
              <ActBtn title="react" onClick={() => setShowReact((s) => !s)}>😀</ActBtn>
              <ActBtn title="reply" onClick={onReply}>↩︎</ActBtn>
              {mine && message.kind === "text" && (
                <ActBtn title="edit" onClick={() => { setDraft(message.content); setEditing(true); }}>✏️</ActBtn>
              )}
              {mine && (
                <ActBtn title="delete" onClick={() => start(() => void deleteMessage(message.id))}>🗑️</ActBtn>
              )}
            </div>

            {/* bubble body */}
            <div className={mine ? "order-2" : "order-1"}>
              {isSticker ? (
                <div className="text-6xl leading-none px-1 py-1 animate-pop">{message.content}</div>
              ) : message.kind === "gif" && message.gif_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.gif_url}
                  alt="gif"
                  className="rounded-bubble max-w-[240px] w-full shadow-soft"
                  loading="lazy"
                />
              ) : editing ? (
                <div className="flex flex-col gap-1">
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                      if (e.key === "Escape") setEditing(false);
                    }}
                    className="input-cute text-sm w-56 resize-none"
                    rows={2}
                  />
                  <div className="flex gap-1 justify-end text-xs">
                    <button onClick={() => setEditing(false)} className="text-inkSoft px-2">cancel</button>
                    <button onClick={saveEdit} className="text-lav-700 font-semibold px-2">save</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`px-3.5 py-2 rounded-bubble whitespace-pre-wrap break-words leading-relaxed ${
                    mine
                      ? "bg-gradient-to-br from-lav-500 to-lav-700 text-white rounded-br-md shadow-cute"
                      : "bg-white text-ink rounded-bl-md shadow-soft border border-white"
                  }`}
                >
                  {message.content}
                  {message.edited && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
                </div>
              )}
            </div>

            {/* quick react popover */}
            <AnimatePresence>
              {showReact && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowReact(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute z-40 -top-11 ${mine ? "right-0" : "left-0"} card px-2 py-1.5 flex gap-1`}
                  >
                    {QUICK_REACTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => react(e)}
                        className="text-xl hover:scale-125 transition"
                      >
                        {e}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* reactions row */}
          {grouped_rx.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : ""}`}>
              {grouped_rx.map((g) => {
                const mineReacted = g.profileIds.includes(me.id);
                return (
                  <button
                    key={g.emoji}
                    onClick={() => react(g.emoji)}
                    className={`text-xs rounded-full px-2 py-0.5 border transition flex items-center gap-1 ${
                      mineReacted
                        ? "bg-lav-200 border-lav-400 scale-105"
                        : "bg-white/80 border-white hover:bg-lav-50"
                    }`}
                  >
                    <span>{g.emoji}</span>
                    {g.count > 1 && <span className="text-inkSoft">{g.count}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* timestamp */}
          {!grouped && (
            <span className="text-[10px] text-inkSoft/60 mt-0.5 px-1">{clockTime(message.created_at)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-sm w-7 h-7 grid place-items-center rounded-full bg-white/80 hover:bg-white border border-white/80 shadow-soft transition"
    >
      {children}
    </button>
  );
}

function groupReactions(rx: Reaction[]) {
  const map = new Map<string, { emoji: string; count: number; profileIds: string[] }>();
  for (const r of rx) {
    const g = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, profileIds: [] };
    g.count++;
    g.profileIds.push(r.profile_id);
    map.set(r.emoji, g);
  }
  return [...map.values()];
}
