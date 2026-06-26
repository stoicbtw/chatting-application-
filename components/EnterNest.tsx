"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockNest, nestLoginOrJoin, requestReset, checkReset, completeReset } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { AVATARS } from "@/lib/moods";

type Member = { id: string; name: string; display_name: string; avatar_emoji: string };
type Step = "locked" | "members" | "resetWait" | "resetSet";

export default function EnterNest({ slug, exists, nestName }: { slug: string; exists: boolean; nestName: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [step, setStep] = useState<Step>("locked");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // shared secrets / data
  const [commonPassword, setCommonPassword] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [full, setFull] = useState(false);

  // member login / create
  const [tab, setTab] = useState<"login" | "create">("login");
  const [selected, setSelected] = useState<Member | null>(null);
  const [passcode, setPasscode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🐻");

  // reset flow
  const [resetReq, setResetReq] = useState<{ id: string; partnerName: string; memberName: string } | null>(null);
  const [partnerNote, setPartnerNote] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");

  if (!exists) {
    return (
      <div className="card w-full max-w-md p-7 text-center">
        <div className="text-5xl mb-2">🪹</div>
        <h1 className="font-display text-2xl text-lav-800">no nest called “{slug}”</h1>
        <p className="text-inkSoft text-sm mt-1">double-check the name, or make a brand new one</p>
        <div className="flex gap-2 justify-center mt-5">
          <Link href="/" className="btn-ghost">← all nests</Link>
          <Link href="/create" className="btn-cute">create “{slug}” ✨</Link>
        </div>
      </div>
    );
  }

  // ── step 1: common password ─────────────────────────────
  function unlock() {
    setError(null);
    setBusy(true);
    start(async () => {
      const res = await unlockNest(slug, commonPassword);
      setBusy(false);
      if (!res.ok) return setError(res.error);
      setMembers(res.members);
      setFull(res.full);
      setTab(res.members.length === 0 || !res.full ? (res.members.length ? "login" : "create") : "login");
      if (res.members[0]) setSelected(res.members[0]);
      setStep("members");
    });
  }

  // ── step 2: login or create ─────────────────────────────
  function enter() {
    setError(null);
    setBusy(true);
    start(async () => {
      const res = await nestLoginOrJoin(
        tab === "login"
          ? { slug, commonPassword, mode: "login", name: selected?.name, passcode }
          : { slug, commonPassword, mode: "create", passcode, displayName, avatarEmoji: avatar }
      );
      setBusy(false);
      if (res.ok && res.slug) router.replace(`/n/${res.slug}`);
      else if (!res.ok) setError(res.error);
    });
  }

  // ── reset: requester starts it ──────────────────────────
  function startReset(m: Member) {
    setError(null);
    setBusy(true);
    start(async () => {
      const res = await requestReset(slug, commonPassword, m.id);
      setBusy(false);
      if (!res.ok) return setError(res.error);
      setResetReq({ id: res.requestId!, partnerName: res.partnerName!, memberName: m.display_name });
      setStep("resetWait");
    });
  }

  // listen for partner approval (realtime + poll fallback)
  useEffect(() => {
    if (step !== "resetWait" || !resetReq) return;
    let done = false;
    const onApproved = (status: string, note: string | null) => {
      if (done) return;
      if (status === "approved") {
        done = true;
        setPartnerNote(note);
        setStep("resetSet");
      } else if (status === "declined") {
        done = true;
        setError("Your partner declined the reset 🥺");
        setStep("members");
      }
    };
    const supabase = supabaseBrowser();
    const ch = supabase
      .channel(`reset-${resetReq.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reset_requests", filter: `id=eq.${resetReq.id}` },
        (p) => onApproved((p.new as any).status, (p.new as any).partner_note)
      )
      .subscribe();
    const poll = setInterval(async () => {
      const r = await checkReset(resetReq.id);
      if (r) onApproved(r.status, r.note);
    }, 4000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
    };
  }, [step, resetReq]);

  function finishReset() {
    if (!resetReq) return;
    setError(null);
    setBusy(true);
    start(async () => {
      const res = await completeReset({ slug, commonPassword, requestId: resetReq.id, newPasscode: newPass });
      setBusy(false);
      if (res.ok && res.slug) router.replace(`/n/${res.slug}`);
      else if (!res.ok) setError(res.error);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="card w-full max-w-md p-7"
    >
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-inkSoft hover:text-lav-700">← nests</Link>
        <span className="chip text-xs">/n/{slug}</span>
      </div>

      <div className="text-center my-4">
        <div className="text-5xl mb-1 animate-float inline-block">🪺</div>
        <h1 className="font-display text-3xl text-lav-800">{nestName}</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === "locked" && (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <label className="text-sm font-semibold text-inkSoft ml-1">nest password 🔑</label>
            <input
              type="password"
              autoFocus
              className="input-cute w-full mt-1"
              placeholder="the secret you both share"
              value={commonPassword}
              onChange={(e) => setCommonPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
            />
            <button onClick={unlock} disabled={busy} className="btn-cute w-full mt-4 py-3">
              {busy ? "knocking…" : "knock knock 🚪"}
            </button>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === "members" && (
          <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-2 mb-4 p-1 bg-lav-100 rounded-full">
              <button
                onClick={() => setTab("login")}
                disabled={members.length === 0}
                className={`flex-1 rounded-full py-2 font-semibold transition disabled:opacity-40 ${
                  tab === "login" ? "bg-white shadow-soft text-lav-800" : "text-inkSoft"
                }`}
              >
                I'm back 👋
              </button>
              <button
                onClick={() => setTab("create")}
                disabled={full}
                className={`flex-1 rounded-full py-2 font-semibold transition disabled:opacity-40 ${
                  tab === "create" ? "bg-white shadow-soft text-lav-800" : "text-inkSoft"
                }`}
              >
                First time ✨
              </button>
            </div>

            {tab === "login" ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className={`rounded-bubble p-3 border-2 transition text-center ${
                        selected?.id === m.id ? "border-lav-400 bg-lav-50" : "border-lav-100 hover:border-lav-300"
                      }`}
                    >
                      <div className="text-3xl">{m.avatar_emoji}</div>
                      <div className="font-semibold text-sm truncate">{m.display_name}</div>
                    </button>
                  ))}
                </div>
                <input
                  type="password"
                  className="input-cute w-full"
                  placeholder="your personal passcode 🔐"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enter()}
                />
                {selected && (
                  <button
                    onClick={() => startReset(selected)}
                    className="text-xs text-inkSoft/80 hover:text-lav-700 mt-2 ml-1"
                  >
                    forgot your passcode, {selected.display_name}? 🥺
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <input className="input-cute w-full" placeholder="your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar p-1">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`text-2xl w-9 h-9 rounded-xl grid place-items-center transition ${
                        avatar === a ? "bg-lav-200 scale-110" : "hover:bg-lav-100"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  type="password"
                  className="input-cute w-full"
                  placeholder="make a personal passcode 🔐"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enter()}
                />
              </div>
            )}

            <button onClick={enter} disabled={busy} className="btn-cute w-full mt-4 py-3">
              {busy ? "opening…" : "come in 💜"}
            </button>
          </motion.div>
        )}

        {/* RESET: waiting for partner */}
        {step === "resetWait" && resetReq && (
          <motion.div key="rw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="text-5xl mb-2 animate-heartbeat">💗</div>
            <p className="font-display text-xl text-lav-800">waiting for {resetReq.partnerName}…</p>
            <p className="text-inkSoft text-sm mt-2 bg-lav-50 rounded-2xl p-3">
              Ask <b>{resetReq.partnerName}</b> to open the nest. They'll see your request and have to say
              <b> one thing they love about you</b> to let you back in 💕
            </p>
            <div className="flex items-center justify-center gap-1 mt-4 text-inkSoft text-sm">
              <span className="w-2 h-2 rounded-full bg-lav-400 animate-bouncedot" />
              <span className="w-2 h-2 rounded-full bg-lav-400 animate-bouncedot" style={{ animationDelay: "0.15s" }} />
              <span className="w-2 h-2 rounded-full bg-lav-400 animate-bouncedot" style={{ animationDelay: "0.3s" }} />
            </div>
            <button onClick={() => setStep("members")} className="text-xs text-inkSoft/70 hover:text-lav-700 mt-4">
              cancel
            </button>
          </motion.div>
        )}

        {/* RESET: approved → set new passcode */}
        {step === "resetSet" && (
          <motion.div key="rs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-3">
              <div className="text-5xl mb-1 animate-pop">💌</div>
              <p className="font-display text-lg text-lav-800">{resetReq?.partnerName} let you in!</p>
            </div>
            {partnerNote && (
              <p className="text-center text-ink bg-blush/30 rounded-2xl p-3 italic mb-3">
                “{partnerNote}”
              </p>
            )}
            <label className="text-sm font-semibold text-inkSoft ml-1">your new passcode 🔐</label>
            <input
              type="password"
              autoFocus
              className="input-cute w-full mt-1"
              placeholder="something you'll remember 🥺"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && finishReset()}
            />
            <button onClick={finishReset} disabled={busy} className="btn-cute w-full mt-4 py-3">
              {busy ? "saving…" : "set it & come in 💜"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-center text-sm text-rose-500 mt-3 font-medium">{error}</p>}
    </motion.div>
  );
}
