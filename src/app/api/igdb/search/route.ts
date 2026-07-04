import { NextRequest, NextResponse } from "next/server";
import { searchGames, coverUrl, gameYear } from "@/lib/igdb";
import { getCurrentUser } from "@/lib/current-user";
import { resolveTwitch } from "@/lib/api-keys";

// GET /api/igdb/search?q=...  -> IGDB zaidimu paieska. Reikia prisijungti.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Reikia prisijungti" }, { status: 401 });
  }
  const twitch = resolveTwitch(user);
  if (!twitch.canSearch || !twitch.clientId || !twitch.clientSecret) {
    return NextResponse.json(
      { error: "needOwnKeys", message: "Reikia įvesti savo Twitch/IGDB raktus profilyje." },
      { status: 403 }
    );
  }

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const games = await searchGames(q, {
      clientId: twitch.clientId,
      clientSecret: twitch.clientSecret,
      includeAdult: user.allowAdult,
    });
    const mapped = games.map((g) => ({
      igdbId: g.id,
      title: g.name,
      overview: g.summary || "",
      year: gameYear(g),
      poster: coverUrl(g.cover?.image_id, "t_cover_small"),
    }));
    return NextResponse.json({ results: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
