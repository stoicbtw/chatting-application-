"use client";

import { useEffect, useRef, useState } from "react";

type Gif = { id: string; preview: string; url: string; alt: string; blur: string | null; ratio: number };

const SUGGESTIONS = ["cute", "love", "hug", "miss you", "cat", "happy", "kiss", "dance", "sleepy", "sorry"];

export default function GifPicker({ onPick }: { onPick: (url: string) => void }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load(q: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error && (!data.results || data.results.length === 0)) {
        setErr(data.error === "KLIPY_API_KEY not set" ? "Add KLIPY_API_KEY to enable GIFs 🔑" : "GIFs unavailable right now 🥺");
      }
      setGifs(data.results ?? []);
    } catch {
      setErr("Couldn't reach the GIF server 🥺");
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(v: string) {
    setQuery(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(v), 350);
  }

  return (
    <div className="flex flex-col h-[300px]">
      <input
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="search gifs… 🎞️"
        className="rounded-full bg-lav-50 border border-lav-200 px-3 py-1.5 text-sm outline-none focus:border-lav-400 mb-2"
      />

      {!query && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-2 pb-0.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSearch(s)}
              className="chip whitespace-nowrap text-xs hover:bg-lav-200 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="h-full grid place-items-center text-inkSoft">
            <div className="text-3xl animate-wiggle">🎞️</div>
          </div>
        ) : err ? (
          <div className="h-full grid place-items-center text-center text-sm text-inkSoft px-6">{err}</div>
        ) : gifs.length === 0 ? (
          <div className="h-full grid place-items-center text-center text-sm text-inkSoft px-6">no gifs found 🥺</div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-1.5 [column-fill:_balance]">
            {gifs.map((g) => (
              <button
                key={g.id}
                onClick={() => onPick(g.url)}
                className="mb-1.5 w-full overflow-hidden rounded-xl block hover:ring-2 ring-lav-400 transition bg-lav-50"
                style={
                  g.blur
                    ? { backgroundImage: `url(${g.blur})`, backgroundSize: "cover" }
                    : undefined
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.preview} alt={g.alt} loading="lazy" className="w-full block" />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-inkSoft/60 text-center mt-1">powered by KLIPY</p>
    </div>
  );
}
