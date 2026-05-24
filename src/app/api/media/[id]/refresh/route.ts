import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importFromTmdb } from "@/lib/media-cache";
import { isAdmin } from "@/lib/admin";

// POST /api/media/[id]/refresh -> priverstinai perparsiunta metaduomenis is TMDB.
// Tik adminui.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Reikia prisijungti" }, { status: 401 });
  }
  const { id } = await params;
  const media = await db.mediaItem.findUnique({ where: { id } });

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
    await importFromTmdb({ type: media.type, tmdbType, tmdbId: media.tmdbId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nezinoma klaida" },
      { status: 500 }
    );
  }
}
