import { NextRequest, NextResponse } from "next/server";
import { checkApiKey } from "@/lib/api-key";
import { searchMulti, posterUrl } from "@/lib/tmdb";

// GET /api/admin/search?q=...  -> TMDB paieska (admin API, raktas)
export async function GET(req: NextRequest) {
  const k = checkApiKey(req);
  if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchMulti(q);
    return NextResponse.json({
      results: results.map((r) => ({
        tmdbId: r.id,
        tmdbType: r.media_type,
        title: r.title || r.name || "",
        year: (r.release_date || r.first_air_date || "").slice(0, 4) || null,
        poster: posterUrl(r.poster_path, "w200"),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Klaida" },
      { status: 500 }
    );
  }
}
