"use client";

import { useCallbackRef } from "@/components/useCallbackRef";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { heartbeat, sendNudge as persistNudge } from "@/app/actions";
import type { Message, Profile, Reaction } from "@/lib/types";
import Header from "@/components/Header";
import MessageList from "@/components/MessageList";
import Composer from "@/components/Composer";
import PetWidget from "@/components/PetWidget";
import NudgeLayer from "@/components/NudgeLayer";

export type NudgeKind = "poke" | "love" | "hug";

export default function ChatRoom({
  me: meInit,
  partner: partnerInit,
  initialMessages,
}: {
  me: Profile;
  partner: Profile | null;
  initialMessages: Message[];
}) {
  const [me, setMe] = useState(meInit);
  const [partner, setPartner] = useState(partnerInit);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [incomingNudge, setIncomingNudge] = useState<{ kind: NudgeKind; tick: number } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const seen = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const liveRef = useRef<RealtimeChannel | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // keep a stable ref so realtime callbacks always see fresh partner id
  const partnerId = partner?.id ?? null;

  // ── realtime: db changes ────────────────────────────────
  useEffect(() => {
    const supabase = supabaseBrowser();

    const refreshReactions = async (mid: string) => {
      const { data } = await supabase.from("reactions").select("*").eq("message_id", mid);
      setMessages((prev) =>
        prev.map((m) => (m.id === mid ? { ...m, reactions: (data as Reaction[]) ?? [] } : m))
      );
    };

    const db = supabase
      .channel("room-db")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const msg = p.new as Message;
        if (seen.current.has(msg.id)) return;
        seen.current.add(msg.id);
        setMessages((prev) => [...prev, { ...msg, reactions: [] }]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (p) => {
        const msg = p.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (p) => {
        const old = p.old as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, (p) => {
        const mid = (p.new as Reaction)?.message_id || (p.old as Reaction)?.message_id;
        if (mid) refreshReactions(mid);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (p) => {
        const prof = p.new as Profile;
        setMe((cur) => (prof.id === cur.id ? { ...cur, ...prof } : cur));
        setPartner((cur) => (cur && prof.id === cur.id ? { ...cur, ...prof } : cur));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(db);
    };
  }, []);

  // ── realtime: live (typing / presence / nudge) ──────────
  useEffect(() => {
    const supabase = supabaseBrowser();
    const live = supabase.channel("room-live", { config: { presence: { key: me.id } } });
    liveRef.current = live;

    live
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.from !== me.id) setPartnerTyping(!!payload.typing);
      })
      .on("broadcast", { event: "nudge" }, ({ payload }) => {
        if (payload.from !== me.id) setIncomingNudge({ kind: payload.kind, tick: Date.now() });
      })
      .on("presence", { event: "sync" }, () => {
        const state = live.presenceState();
        const others = Object.keys(state).filter((k) => k !== me.id);
        setPartnerOnline(others.length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await live.track({ id: me.id, at: new Date().toISOString() });
      });

    return () => {
      supabase.removeChannel(live);
      liveRef.current = null;
    };
  }, [me.id]);

  // ── presence heartbeat (persists last_seen too) ─────────
  useEffect(() => {
    heartbeat();
    const t = setInterval(() => heartbeat(), 25_000);
    return () => clearInterval(t);
  }, []);

  // clear typing after a quiet moment (safety net)
  useEffect(() => {
    if (!partnerTyping) return;
    const t = setTimeout(() => setPartnerTyping(false), 4000);
    return () => clearTimeout(t);
  }, [partnerTyping]);

  // ── screen shake when nudged ────────────────────────────
  useEffect(() => {
    if (!incomingNudge) return;
    const el = rootRef.current;
    if (el) {
      el.classList.remove("animate-shake");
      void el.offsetWidth; // reflow to restart animation
      el.classList.add("animate-shake");
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([60, 40, 80]);
    const t = setTimeout(() => el?.classList.remove("animate-shake"), 700);
    return () => clearTimeout(t);
  }, [incomingNudge]);

  // ── outgoing handlers passed to children ────────────────
  const sendTyping = useCallbackRef((typing: boolean) => {
    liveRef.current?.send({ type: "broadcast", event: "typing", payload: { from: me.id, typing } });
  });

  const doNudge = useCallbackRef(async (kind: NudgeKind) => {
    if (!partnerId) return;
    liveRef.current?.send({ type: "broadcast", event: "nudge", payload: { from: me.id, kind } });
    // local feedback heart burst
    setIncomingNudge({ kind, tick: Date.now() + 1 });
    persistNudge(partnerId, kind);
  });

  const appendOptimistic = useCallbackRef((m: Message) => {
    if (seen.current.has(m.id)) return;
    seen.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  });

  const profilesById = useMemo(() => {
    const map: Record<string, Profile> = { [me.id]: me };
    if (partner) map[partner.id] = partner;
    return map;
  }, [me, partner]);

  return (
    <div ref={rootRef} className="relative z-10 min-h-dvh flex justify-center">
      <NudgeLayer nudge={incomingNudge} />

      <div className="w-full max-w-2xl flex flex-col h-dvh">
        <Header
          me={me}
          partner={partner}
          partnerOnline={partnerOnline}
          onNudge={doNudge}
        />

        <MessageList
          messages={messages}
          me={me}
          profilesById={profilesById}
          partnerTyping={partnerTyping}
          partner={partner}
          onReply={setReplyTo}
        />

        <Composer
          me={me}
          partner={partner}
          replyTo={replyTo}
          clearReply={() => setReplyTo(null)}
          onSent={appendOptimistic}
          onTyping={sendTyping}
          onNudge={doNudge}
        />
      </div>

      <PetWidget me={me} partner={partner} />
    </div>
  );
}
