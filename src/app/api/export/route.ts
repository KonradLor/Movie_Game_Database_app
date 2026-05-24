import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/export?format=json|csv -> SAVO irasu eksportas. Reikia prisijungti.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Reikia prisijungti" }, { status: 401 });
  }
  const format = req.nextUrl.searchParams.get("format") || "json";

  const items = await db.mediaItem.findMany({
    where: { userId: user.id },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = items.map((i) => ({
    type: i.type,
    title: i.title,
    originalTitle: i.originalTitle,
    year: i.year,
    durationMin: i.durationMin,
    rating: i.rating,
    opinion: i.opinion,
    status: i.status,
    watchCount: i.watchCount,
    firstWatched: i.firstWatched?.toISOString().slice(0, 10) ?? "",
    lastWatched: i.lastWatched?.toISOString().slice(0, 10) ?? "",
    visibility: i.visibility,
    tags: i.tags.map((x) => x.tag.name).join("; "),
    description: i.description,
    posterUrl: i.posterUrl,
    tmdbId: i.tmdbId,
    igdbId: i.igdbId,
  }));

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const headers = Object.keys(rows[0] || { title: "" });
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(",")),
    ].join("\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="media-databank-${stamp}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="media-databank-${stamp}.json"`,
    },
  });
}
