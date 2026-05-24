import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importFromTmdb } from "@/lib/media-cache";
import { getCurrentUser } from "@/lib/current-user";

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
  if (!media.tmdbId) {
    return NextResponse.json(
      { error: "Sis irasas neturi TMDB saltinio (rankinis)" },
      { status: 400 }
    );
  }

  try {
    const tmdbType = media.type === "SERIES" || media.type === "ANIME" ? "tv" : "movie";
    await importFromTmdb({ userId: user.id, type: media.type, tmdbType, tmdbId: media.tmdbId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
