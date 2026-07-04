import { NextRequest, NextResponse } from "next/server";
import { importFromTmdb, ADULT_BLOCKED } from "@/lib/media-cache";
import { getCurrentUser } from "@/lib/current-user";
import { resolveTmdb } from "@/lib/api-keys";
import type { MediaType } from "@prisma/client";
import type { TmdbMediaType } from "@/lib/tmdb";

const VALID_TYPES: MediaType[] = [
  "MOVIE",
  "SERIES",
  "ANIME",
  "DOCUMENTARY",
  "GAME",
];

// POST /api/media/import  body: { type, tmdbType, tmdbId }
// Parsiuncia is TMDB ir issaugo i DB (write-through cache). Tik adminui.
export async function POST(req: NextRequest) {
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
  try {
    const body = await req.json();
    const type = body.type as MediaType;
    const tmdbType = body.tmdbType as TmdbMediaType;
    const tmdbId = Number(body.tmdbId);

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Netinkamas type" }, { status: 400 });
    }
    if (tmdbType !== "movie" && tmdbType !== "tv") {
      return NextResponse.json({ error: "Netinkamas tmdbType" }, { status: 400 });
    }
    if (!tmdbId) {
      return NextResponse.json({ error: "Truksta tmdbId" }, { status: 400 });
    }

    const id = await importFromTmdb({
      userId: user.id,
      type,
      tmdbType,
      tmdbId,
      readToken: tmdb.readToken ?? undefined,
      allowAdult: user.allowAdult,
    });
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === ADULT_BLOCKED) {
      return NextResponse.json(
        { error: ADULT_BLOCKED, message: "Suaugusiuju turinys blokuojamas (ijunk profilyje)." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
