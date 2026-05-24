import { NextRequest, NextResponse } from "next/server";
import { importFromTmdb } from "@/lib/media-cache";
import { isAdmin } from "@/lib/admin";
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
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Reikia prisijungti" }, { status: 401 });
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

    const id = await importFromTmdb({ type, tmdbType, tmdbId });
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
