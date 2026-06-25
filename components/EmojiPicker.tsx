"use client";

import { useState } from "react";
import { EMOJI_GROUPS, searchEmoji } from "@/lib/emoji";

export default function EmojiPicker({
  onInsert,
  onSticker,
}: {
  onInsert: (e: string) => void;
  onSticker: (e: string) => void;
}) {
  const [group, setGroup] = useState(0);
  const [query, setQuery] = useState("");
  const [stickerMode, setStickerMode] = useState(false);

  const emojis = query ? searchEmoji(query) : EMOJI_GROUPS[group].emojis;

  function pick(e: string) {
    if (stickerMode) onSticker(e);
    else onInsert(e);
  }

  return (
    <div className="flex flex-col h-[300px]">
      {/* search + sticker toggle */}
      <div className="flex items-center gap-2 mb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search… (heart, cat, star)"
          className="flex-1 rounded-full bg-lav-50 border border-lav-200 px-3 py-1.5 text-sm outline-none focus:border-lav-400"
        />
        <button
          onClick={() => setStickerMode((s) => !s)}
          title="send as a big sticker"
          className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition ${
            stickerMode ? "bg-lav-600 text-white border-lav-600" : "bg-white border-lav-200 text-inkSoft"
          }`}
        >
          {stickerMode ? "sticker 🎏" : "insert ✍️"}
        </button>
      </div>

      {/* group tabs */}
      {!query && (
        <div className="flex gap-1 mb-1">
          {EMOJI_GROUPS.map((g, i) => (
            <button
              key={g.name}
              onClick={() => setGroup(i)}
              className={`text-xl rounded-xl flex-1 py-1 transition ${
                group === i ? "bg-lav-100" : "hover:bg-lav-50"
              }`}
              title={g.name}
            >
              {g.icon}
            </button>
          ))}
        </div>
      )}

      {/* grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-8 gap-0.5 content-start">
        {emojis.map((e, i) => (
          <button
            key={e + i}
            onClick={() => pick(e)}
            className="text-2xl rounded-lg aspect-square grid place-items-center hover:bg-lav-100 active:scale-90 transition"
          >
            {e}
          </button>
        ))}
        {emojis.length === 0 && (
          <p className="col-span-8 text-center text-sm text-inkSoft py-6">no matches 🥺</p>
        )}
      </div>

      {stickerMode && (
        <p className="text-[11px] text-inkSoft text-center mt-1">tap any emoji to send it BIG 🪄</p>
      )}
    </div>
  );
}
