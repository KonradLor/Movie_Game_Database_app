// Bendras servisas media irasu kurimui/redagavimui is paprastu objektu (JSON).
// Naudoja admin API (Faze 4c). Programos UI naudoja actions.ts (FormData).

import type { MediaType, Visibility, MediaStatus, Prisma } from "@prisma/client";
import { db } from "./db";

export interface MediaInput {
  type?: MediaType;
  title?: string;
  originalTitle?: string | null;
  year?: number | null;
  durationMin?: number | null;
  description?: string | null;
  posterUrl?: string | null;
  rating?: number | null;
  opinion?: string | null;
  status?: MediaStatus;
  watchCount?: number;
  firstWatched?: string | null; // ISO data
  lastWatched?: string | null;
  visibility?: Visibility;
  tags?: string[];
}

function toDate(v?: string | null): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function syncTags(mediaId: string, tags?: string[]) {
  if (!tags) return;
  await db.tagOnMedia.deleteMany({ where: { mediaId } });
  for (const name of tags.map((t) => t.trim()).filter(Boolean)) {
    const tag = await db.tag.upsert({ where: { name }, update: {}, create: { name } });
    await db.tagOnMedia.create({ data: { mediaId, tagId: tag.id } });
  }
}

export async function createMediaFromData(input: MediaInput): Promise<string> {
  const media = await db.mediaItem.create({
    data: {
      type: input.type || "MOVIE",
      title: input.title || "(be pavadinimo)",
      originalTitle: input.originalTitle ?? null,
      year: input.year ?? null,
      durationMin: input.durationMin ?? null,
      description: input.description ?? null,
      posterUrl: input.posterUrl ?? null,
      rating: input.rating ?? null,
      opinion: input.opinion ?? null,
      status: input.status || "WATCHED",
      watchCount: input.watchCount ?? 1,
      firstWatched: toDate(input.firstWatched) ?? null,
      lastWatched: toDate(input.lastWatched) ?? null,
      visibility: input.visibility || "PUBLIC",
      source: "MANUAL",
    },
  });
  await syncTags(media.id, input.tags);
  return media.id;
}

export async function updateMediaFromData(id: string, input: MediaInput): Promise<void> {
  const data: Prisma.MediaItemUpdateInput = {
    type: input.type,
    title: input.title,
    originalTitle: input.originalTitle,
    year: input.year,
    durationMin: input.durationMin,
    description: input.description,
    posterUrl: input.posterUrl,
    rating: input.rating,
    opinion: input.opinion,
    status: input.status,
    watchCount: input.watchCount,
    firstWatched: toDate(input.firstWatched),
    lastWatched: toDate(input.lastWatched),
    visibility: input.visibility,
  };
  // Pasalinam undefined, kad neperrasytume nepateiktu lauku
  Object.keys(data).forEach(
    (k) => (data as Record<string, unknown>)[k] === undefined && delete (data as Record<string, unknown>)[k]
  );
  await db.mediaItem.update({ where: { id }, data });
  if (input.tags) await syncTags(id, input.tags);
}
