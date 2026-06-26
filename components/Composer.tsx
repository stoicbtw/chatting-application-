"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message, Profile } from "@/lib/types";
import type { NudgeKind } from "@/components/ChatRoom";
import { sendMessage } from "@/app/actions";
import EmojiPicker from "@/components/EmojiPicker";
import GifPicker from "@/components/GifPicker";

export default function Composer({
  me,
  partner,
  replyTo,
  clearReply,
  onSent,
  onTyping,
  onNudge,
}: {
  me: Profile;
  partner: Profile | null;
  replyTo: Message | null;
  clearReply: () => void;
  onSent: (m: Message) => void;
  onTyping: (t: boolean) => void;
  onNudge: (k: NudgeKind) => void;
}) {
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<null | "emoji" | "gif">(null);
  const [, start] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function grow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  function onChange(v: string) {
    setText(v);
    requestAnimationFrame(grow);
    onTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1500);
  }

  function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    onTyping(false);
    requestAnimationFrame(grow);
    const reply = replyTo?.id ?? null;
    clearReply();
    start(async () => {
      const res = await sendMessage({ meId: me.id, kind: "text", content, reply_to: reply });
      if (res.ok && res.message) onSent(res.message);
    });
  }

  function sendSticker(emoji: string) {
    setPanel(null);
    start(async () => {
      const res = await sendMessage({ meId: me.id, kind: "sticker", content: emoji });
      if (res.ok && res.message) onSent(res.message);
    });
  }

  function sendGif(url: string) {
    setPanel(null);
    start(async () => {
      const res = await sendMessage({ meId: me.id, kind: "gif", gif_url: url, content: "" });
      if (res.ok && res.message) onSent(res.message);
    });
  }

  function insert(emoji: string) {
    const el = taRef.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const s = el.selectionStart ?? text.length;
    const e = el.selectionEnd ?? text.length;
    const next = text.slice(0, s) + emoji + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + emoji.length;
      grow();
    });
  }

  return (
    <div className="px-3 pb-3 pt-1 relative">
      {/* reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="card px-3 py-2 mb-2 flex items-center gap-2 text-sm"
          >
            <span className="text-lav-600">↩︎ replying to</span>
            <span className="text-inkSoft truncate flex-1">
              {replyTo.kind === "gif" ? "a gif 🎞️" : replyTo.content.slice(0, 60)}
            </span>
            <button onClick={clearReply} className="text-inkSoft hover:text-rose-400">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* pickers */}
      <AnimatePresence>
        {panel === "emoji" && (
          <Panel onClose={() => setPanel(null)}>
            <EmojiPicker onInsert={insert} onSticker={sendSticker} />
          </Panel>
        )}
        {panel === "gif" && (
          <Panel onClose={() => setPanel(null)}>
            <GifPicker onPick={sendGif} />
          </Panel>
        )}
      </AnimatePresence>

      {/* input row */}
      <div className="card flex items-end gap-1.5 p-1.5">
        <IconBtn active={panel === "emoji"} onClick={() => setPanel((p) => (p === "emoji" ? null : "emoji"))} title="emoji & stickers">
          😀
        </IconBtn>
        <IconBtn active={panel === "gif"} onClick={() => setPanel((p) => (p === "gif" ? null : "gif"))} title="gif">
          <span className="text-xs font-bold tracking-tight">GIF</span>
        </IconBtn>

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={partner ? `message ${partner.display_name}… 💌` : "say hi to the void… 🫧"}
          className="flex-1 bg-transparent resize-none outline-none px-2 py-2 max-h-[140px] text-ink placeholder:text-inkSoft/60"
        />

        {text.trim() ? (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={send}
            className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-lav-500 to-lav-700 text-white grid place-items-center shadow-cute text-lg"
            title="send"
          >
            💌
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.85, rotate: -15 }}
            onClick={() => onNudge("poke")}
            disabled={!partner}
            className="shrink-0 w-11 h-11 rounded-full bg-white border border-lav-200 grid place-items-center text-lg disabled:opacity-40"
            title="poke them"
          >
            👉
          </motion.button>
        )}
      </div>
    </div>
  );
}

function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        className="absolute bottom-[72px] left-3 right-3 z-30 card p-2 max-h-[340px] overflow-hidden"
      >
        {children}
      </motion.div>
    </>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`shrink-0 w-10 h-10 rounded-full grid place-items-center text-xl transition ${
        active ? "bg-lav-200" : "hover:bg-lav-100"
      } text-lav-700`}
    >
      {children}
    </button>
  );
}
