import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importFromTmdb, importFromIgdb, ADULT_BLOCKED } from "@/lib/media-cache";
import { getCurrentUser } from "@/lib/current-user";
import { resolveTmdb, resolveTwitch } from "@/lib/api-keys";

// POST /api/media/[id]/refresh -> priverstinai perparsiunta metaduomenis is TMDB.
// Tik SAVO iraso (reikia prisijungti).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Reikia prisijungti" }, { status: 401 });
  }
  const { id } = await params;
  const media = await db.mediaItem.findFirst({ where: { id, userId: user.id } });

  if (!media) {
    return NextResponse.json({ error: "Nerasta" }, { status: 404 });
  }
  if (!media.tmdbId && !media.igdbId) {
    return NextResponse.json(
      { error: "Sis irasas neturi saltinio (rankinis)" },
      { status: 400 }
    );
  }

  try {
    // Zaidimai -> IGDB, kita -> TMDB.
    if (media.igdbId) {
      const twitch = resolveTwitch(user);
      if (!twitch.canSearch || !twitch.clientId || !twitch.clientSecret) {
        return NextResponse.json(
          { error: "Reikia įvesti savo Twitch/IGDB raktus profilyje" },
          { status: 403 }
        );
      }
      await importFromIgdb({
        userId: user.id,
        igdbId: media.igdbId,
        creds: { clientId: twitch.clientId, clientSecret: twitch.clientSecret },
        allowAdult: user.allowAdult,
      });
      return NextResponse.json({ ok: true });
    }

    const tmdb = resolveTmdb(user);
    if (!tmdb.canSearch) {
      return NextResponse.json(
        { error: "Reikia įvesti savo TMDB raktus profilyje" },
        { status: 403 }
      );
    }
    const tmdbType = media.type === "SERIES" || media.type === "ANIME" ? "tv" : "movie";
    await importFromTmdb({
      userId: user.id,
      type: media.type,
      tmdbType,
      tmdbId: media.tmdbId!,
      readToken: tmdb.readToken ?? undefined,
      allowAdult: user.allowAdult,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === ADULT_BLOCKED) {
      return NextResponse.json({ error: ADULT_BLOCKED }, { status: 403 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
