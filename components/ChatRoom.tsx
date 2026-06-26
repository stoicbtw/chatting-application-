"use client";

import { useCallbackRef } from "@/components/useCallbackRef";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { heartbeat, sendNudge as persistNudge, pendingResetsFor } from "@/app/actions";
import type { Message, Nest, Profile, Reaction } from "@/lib/types";
import Header from "@/components/Header";
import MessageList from "@/components/MessageList";
import Composer from "@/components/Composer";
import PetWidget from "@/components/PetWidget";
import NudgeLayer from "@/components/NudgeLayer";
import ResetApproval from "@/components/ResetApproval";

export type NudgeKind = "poke" | "love" | "hug";

export default function ChatRoom({
  me: meInit,
  partner: partnerInit,
  nest,
  initialMessages,
}: {
  me: Profile;
  partner: Profile | null;
  nest: Nest;
  initialMessages: Message[];
}) {
  const [me, setMe] = useState(meInit);
  const [partner, setPartner] = useState(partnerInit);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [incomingNudge, setIncomingNudge] = useState<{ kind: NudgeKind; tick: number } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [resetReqId, setResetReqId] = useState<string | null>(null);

  const seen = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const liveRef = useRef<RealtimeChannel | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const nestId = nest.id;
  const partnerId = partner?.id ?? null;

  // ── realtime: db changes (scoped to this nest) ──────────
  useEffect(() => {
    const supabase = supabaseBrowser();
    const f = `nest_id=eq.${nestId}`;

    const refreshReactions = async (mid: string) => {
      const { data } = await supabase.from("reactions").select("*").eq("message_id", mid);
      setMessages((prev) => prev.map((m) => (m.id === mid ? { ...m, reactions: (data as Reaction[]) ?? [] } : m)));
    };

    const db = supabase
      .channel(`nest-${nestId}-db`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: f }, (p) => {
        const msg = p.new as Message;
        if (seen.current.has(msg.id)) return;
        seen.current.add(msg.id);
        setMessages((prev) => [...prev, { ...msg, reactions: [] }]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: f }, (p) => {
        const msg = p.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (p) => {
        const old = p.old as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions", filter: f }, (p) => {
        const mid = (p.new as Reaction)?.message_id || (p.old as Reaction)?.message_id;
        if (mid) refreshReactions(mid);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: f }, (p) => {
        const prof = p.new as Profile;
        setMe((cur) => (prof.id === cur.id ? { ...cur, ...prof } : cur));
        setPartner((cur) => (cur && prof.id === cur.id ? { ...cur, ...prof } : cur));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reset_requests", filter: f }, (p) => {
        const r = p.new as any;
        if (r?.status === "pending" && r.requester_id !== me.id) setResetReqId(r.id);
        else if (r?.requester_id !== me.id && r?.status !== "pending") setResetReqId(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(db);
    };
  }, [nestId, me.id]);

  // catch a reset requested before we opened the nest
  useEffect(() => {
    pendingResetsFor(me.id).then((reqs) => {
      if (reqs.length) setResetReqId(reqs[0].id);
    });
  }, [me.id]);

  // ── realtime: live (typing / presence / nudge) ──────────
  useEffect(() => {
    const supabase = supabaseBrowser();
    const live = supabase.channel(`nest-${nestId}-live`, { config: { presence: { key: me.id } } });
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
  }, [nestId, me.id]);

  // ── presence heartbeat ──────────────────────────────────
  useEffect(() => {
    heartbeat(me.id);
    const t = setInterval(() => heartbeat(me.id), 25_000);
    return () => clearInterval(t);
  }, [me.id]);

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
      void el.offsetWidth;
      el.classList.add("animate-shake");
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([60, 40, 80]);
    const t = setTimeout(() => el?.classList.remove("animate-shake"), 700);
    return () => clearTimeout(t);
  }, [incomingNudge]);

  // ── outgoing handlers ───────────────────────────────────
  const sendTyping = useCallbackRef((typing: boolean) => {
    liveRef.current?.send({ type: "broadcast", event: "typing", payload: { from: me.id, typing } });
  });

  const doNudge = useCallbackRef(async (kind: NudgeKind) => {
    if (!partnerId) return;
    liveRef.current?.send({ type: "broadcast", event: "nudge", payload: { from: me.id, kind } });
    setIncomingNudge({ kind, tick: Date.now() + 1 });
    persistNudge(me.id, partnerId, kind);
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
      {resetReqId && partner && (
        <ResetApproval
          meId={me.id}
          requestId={resetReqId}
          requesterName={partner.display_name}
          onClose={() => setResetReqId(null)}
        />
      )}

      <div className="w-full max-w-2xl flex flex-col h-dvh">
        <Header me={me} partner={partner} nest={nest} partnerOnline={partnerOnline} onNudge={doNudge} />

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
