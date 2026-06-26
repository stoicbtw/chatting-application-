"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { approveReset, declineReset } from "@/app/actions";

export default function ResetApproval({
  meId,
  requestId,
  requesterName,
  onClose,
}: {
  meId: string;
  requestId: string;
  requesterName: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function approve() {
    setError(null);
    start(async () => {
      const res = await approveReset(meId, requestId, note);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function decline() {
    start(async () => {
      await declineReset(meId, requestId);
      onClose();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] grid place-items-center p-4 bg-lav-900/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="card w-full max-w-sm p-6 text-center"
      >
        <div className="text-5xl mb-2 animate-heartbeat">🥺💔</div>
        <h2 className="font-display text-2xl text-lav-800">{requesterName} forgot their passcode</h2>
        <p className="text-inkSoft text-sm mt-2">
          They want back into your nest. To let them in, tell them
          <b> one thing you love about them</b> 💕
        </p>

        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. you make every boring day feel cozy 🥹"
          className="input-cute w-full mt-4 resize-none text-sm"
        />

        {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={decline} disabled={pending} className="btn-ghost flex-1">not now</button>
          <button onClick={approve} disabled={pending} className="btn-cute flex-1">
            {pending ? "💗" : "let them in 💕"}
          </button>
        </div>
        <p className="text-[11px] text-inkSoft/70 mt-3">they'll see your note and set a new passcode</p>
      </motion.div>
    </motion.div>
  );
}
