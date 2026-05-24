import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkApiKey } from "@/lib/api-key";
import { createMediaFromData } from "@/lib/media-service";
import { importFromTmdb } from "@/lib/media-cache";
import type { MediaType, Prisma } from "@prisma/client";
import type { TmdbMediaType } from "@/lib/tmdb";

// GET /api/admin/media?q=&type=  -> sarasas/paieska (admin API, raktas)
export async function GET(req: NextRequest) {
  const k = checkApiKey(req);
  if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status });

  const q = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || "";
  const where: Prisma.MediaItemWhereInput = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (type) where.type = type as MediaType;

  const items = await db.mediaItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ items });
}

// POST /api/admin/media
//   { tmdbType, tmdbId, type }  -> importas is TMDB (write-through cache)
//   arba { title, type, year, ... }  -> rankinis sukurimas
export async function POST(req: NextRequest) {
  const k = checkApiKey(req);
  if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status });

  try {
    // Admin API operuoja admino dienorasciu (savininkas)
    const adminUser = await db.user.findFirst({
      where: { isAdmin: true },
      orderBy: { userNumber: "asc" },
    });
    if (!adminUser) {
      return NextResponse.json({ error: "Nera admin vartotojo" }, { status: 500 });
    }
    const body = await req.json();
    if (body.tmdbId && body.tmdbType) {
      const id = await importFromTmdb({
        userId: adminUser.id,
        type: (body.type as MediaType) || (body.tmdbType === "tv" ? "SERIES" : "MOVIE"),
        tmdbType: body.tmdbType as TmdbMediaType,
        tmdbId: Number(body.tmdbId),
      });
      return NextResponse.json({ id, ok: true, mode: "tmdb" });
    }
    const id = await createMediaFromData(body, adminUser.id);
    return NextResponse.json({ id, ok: true, mode: "manual" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Klaida" },
      { status: 500 }
    );
  }
}
