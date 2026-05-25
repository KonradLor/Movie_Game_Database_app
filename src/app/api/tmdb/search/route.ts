import { NextRequest, NextResponse } from "next/server";
import { searchMulti, posterUrl } from "@/lib/tmdb";
import { getCurrentUser } from "@/lib/current-user";
import { resolveTmdb } from "@/lib/api-keys";

// GET /api/tmdb/search?q=...  -> TMDB paieska (filmai + serialai). Reikia prisijungti.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Reikia prisijungti" }, { status: 401 });
  }
  const tmdb = resolveTmdb(user);
  if (!tmdb.canSearch) {
    return NextResponse.json(
      { error: "needOwnKeys", message: "Reikia įvesti savo TMDB raktus profilyje." },
      { status: 403 }
    );
  }
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchMulti(q, tmdb.readToken ?? undefined);
    const mapped = results.map((r) => ({
      tmdbId: r.id,
      tmdbType: r.media_type as "movie" | "tv",
      // Pasiulomas portalo tipas (vartotojas gali pakeisti i ANIME/DOCUMENTARY)
      suggestedType: r.media_type === "movie" ? "MOVIE" : "SERIES",
      title: r.title || r.name || "",
      originalTitle: r.original_title || r.original_name || "",
      overview: r.overview || "",
      year: (r.release_date || r.first_air_date || "").slice(0, 4) || null,
      poster: posterUrl(r.poster_path, "w200"),
    }));
    return NextResponse.json({ results: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
