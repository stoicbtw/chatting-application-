import { NextRequest, NextResponse } from "next/server";

// Proxies Tenor so the API key never reaches the browser.
// GET /api/tenor?q=cute+cat   (empty q → trending/featured)

type TenorResult = {
  id: string;
  media_formats?: {
    tinygif?: { url: string; dims: number[] };
    gif?: { url: string; dims: number[] };
    nanogif?: { url: string };
  };
  content_description?: string;
};

export async function GET(req: NextRequest) {
  const key = process.env.TENOR_API_KEY;
  if (!key) {
    return NextResponse.json({ results: [], error: "TENOR_API_KEY not set" }, { status: 200 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = "24";
  const base = "https://tenor.googleapis.com/v2";
  const common = `key=${key}&client_key=cute_chat&limit=${limit}&media_filter=tinygif,gif,nanogif&contentfilter=high`;

  const url = q
    ? `${base}/search?q=${encodeURIComponent(q)}&${common}`
    : `${base}/featured?${common}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ results: [], error: `tenor ${res.status}` }, { status: 200 });
    }
    const data = await res.json();
    const results = (data.results as TenorResult[]).map((r) => {
      const f = r.media_formats || {};
      const preview = f.tinygif?.url || f.nanogif?.url || f.gif?.url || "";
      const full = f.gif?.url || f.tinygif?.url || preview;
      const dims = f.tinygif?.dims || f.gif?.dims || [1, 1];
      return {
        id: r.id,
        preview,
        url: full,
        alt: r.content_description || "gif",
        ratio: dims[0] && dims[1] ? dims[0] / dims[1] : 1,
      };
    });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [], error: "fetch failed" }, { status: 200 });
  }
}
