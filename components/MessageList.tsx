"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Message, Profile } from "@/lib/types";
import { dayLabel } from "@/lib/format";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";

export default function MessageList({
  messages,
  me,
  profilesById,
  partnerTyping,
  partner,
  onReply,
}: {
  messages: Message[];
  me: Profile;
  profilesById: Record<string, Profile>;
  partnerTyping: boolean;
  partner: Profile | null;
  onReply: (m: Message) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom when near bottom or on own message
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
    const last = messages[messages.length - 1];
    if (nearBottom || last?.sender_id === me.id) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, partnerTyping, me.id]);

  let lastDay = "";

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      {messages.length === 0 && (
        <div className="h-full grid place-items-center text-center px-8">
          <div>
            <div className="text-6xl mb-3 animate-float">🫧</div>
            <p className="font-display text-xl text-lav-800">say something cute first</p>
            <p className="text-inkSoft text-sm mt-1">
              this is the very beginning of your little world 💜
            </p>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((m, i) => {
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const prev = messages[i - 1];
          const grouped = prev && prev.sender_id === m.sender_id && !showDay;
          const replied = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;

          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex justify-center my-3">
                  <span className="chip text-xs">{day}</span>
                </div>
              )}
              <MessageBubble
                message={m}
                mine={m.sender_id === me.id}
                sender={profilesById[m.sender_id]}
                grouped={!!grouped}
                me={me}
                repliedTo={replied}
                onReply={() => onReply(m)}
              />
            </div>
          );
        })}
      </AnimatePresence>

      {partnerTyping && partner && (
        <TypingIndicator name={partner.display_name} avatar={partner.avatar_emoji} />
      )}

      <div ref={endRef} />
    </div>
  );
}
