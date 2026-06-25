import { NextRequest, NextResponse } from "next/server";

// Proxies KLIPY so the API key never reaches the browser.
// GET /api/gifs?q=cute+cat   (empty q → trending)
// Docs: https://docs.klipy.com/gifs-api  (Tenor shut its public API down)

type KlipyFile = { url: string; width: number; height: number; size: number };
type KlipySize = { gif?: KlipyFile; webp?: KlipyFile; mp4?: KlipyFile };
type KlipyItem = {
  id: number | string;
  slug?: string;
  title?: string;
  type?: string;
  blur_preview?: string;
  file?: { hd?: KlipySize; md?: KlipySize; sm?: KlipySize; xs?: KlipySize };
};

export async function GET(req: NextRequest) {
  const key = process.env.KLIPY_API_KEY;
  if (!key) {
    return NextResponse.json({ results: [], error: "KLIPY_API_KEY not set" }, { status: 200 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = req.nextUrl.searchParams.get("page") ?? "1";
  const base = `https://api.klipy.com/api/v1/${key}/gifs`;
  const params = `per_page=24&page=${page}&rating=g`;
  const url = q ? `${base}/search?q=${encodeURIComponent(q)}&${params}` : `${base}/trending?${params}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ results: [], error: `klipy ${res.status}` }, { status: 200 });
    }
    const data = await res.json();
    const list: KlipyItem[] = data?.data?.data ?? [];

    const results = list
      .filter((it) => it.type !== "ad" && it.file?.sm?.gif?.url)
      .map((it) => {
        const f = it.file!;
        const preview = f.sm?.gif?.url || f.xs?.gif?.url || f.md?.gif?.url || "";
        const full = f.md?.gif?.url || f.hd?.gif?.url || preview;
        const dim = f.sm?.gif || f.md?.gif;
        return {
          id: String(it.id),
          preview,
          url: full,
          alt: it.title || "gif",
          blur: it.blur_preview || null,
          ratio: dim?.width && dim?.height ? dim.width / dim.height : 1,
        };
      });

    return NextResponse.json({ results, hasNext: !!data?.data?.has_next });
  } catch {
    return NextResponse.json({ results: [], error: "fetch failed" }, { status: 200 });
  }
}
