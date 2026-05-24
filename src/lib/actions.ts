"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MediaType, Visibility, MediaStatus } from "@prisma/client";
import { db } from "./db";
import { isAdmin } from "./admin";
import { importFromTmdb } from "./media-cache";
import { cachePersonWorks } from "./people-cache";
import type { TmdbMediaType } from "./tmdb";

async function ensureAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Reikia admin teisiu");
  }
}

// --- Pagalbiniai FormData parseriai ---
function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
function int(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}
function date(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (v === null) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function syncTagsFromString(mediaId: string, tagsCsv: string | null) {
  const names = (tagsCsv || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Pasalinti senus rysius, kuriu nebeliko
  await db.tagOnMedia.deleteMany({ where: { mediaId } });
  for (const name of names) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await db.tagOnMedia.create({ data: { mediaId, tagId: tag.id } });
  }
}

// ----------------------------------------------------------------------
// RANKINIS sukurimas
// ----------------------------------------------------------------------
export async function createManualMedia(fd: FormData) {
  await ensureAdmin();

  const type = (str(fd, "type") as MediaType) || "MOVIE";
  const media = await db.mediaItem.create({
    data: {
      type,
      title: str(fd, "title") || "(be pavadinimo)",
      originalTitle: str(fd, "originalTitle"),
      year: int(fd, "year"),
      durationMin: int(fd, "durationMin"),
      description: str(fd, "description"),
      posterUrl: str(fd, "posterUrl"),
      rating: int(fd, "rating"),
      opinion: str(fd, "opinion"),
      status: (str(fd, "status") as MediaStatus) || "WATCHED",
      watchCount: int(fd, "watchCount") ?? 1,
      firstWatched: date(fd, "firstWatched"),
      lastWatched: date(fd, "lastWatched"),
      visibility: (str(fd, "visibility") as Visibility) || "PUBLIC",
      source: "MANUAL",
    },
  });

  await syncTagsFromString(media.id, str(fd, "tags"));
  revalidatePath("/", "layout");
  redirect("/");
}

// ----------------------------------------------------------------------
// Redagavimas
// ----------------------------------------------------------------------
export async function updateMedia(fd: FormData) {
  await ensureAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");

  await db.mediaItem.update({
    where: { id },
    data: {
      type: (str(fd, "type") as MediaType) || undefined,
      title: str(fd, "title") || undefined,
      originalTitle: str(fd, "originalTitle"),
      year: int(fd, "year"),
      durationMin: int(fd, "durationMin"),
      description: str(fd, "description"),
      posterUrl: str(fd, "posterUrl"),
      rating: int(fd, "rating"),
      opinion: str(fd, "opinion"),
      status: (str(fd, "status") as MediaStatus) || undefined,
      watchCount: int(fd, "watchCount") ?? undefined,
      firstWatched: date(fd, "firstWatched"),
      lastWatched: date(fd, "lastWatched"),
      visibility: (str(fd, "visibility") as Visibility) || undefined,
    },
  });

  await syncTagsFromString(id, str(fd, "tags"));
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// ----------------------------------------------------------------------
// Trynimas
// ----------------------------------------------------------------------
export async function deleteMedia(fd: FormData) {
  await ensureAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  await db.mediaItem.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/");
}

// ----------------------------------------------------------------------
// TMDB importas (write-through cache)
// ----------------------------------------------------------------------
export async function importTmdbAction(fd: FormData) {
  await ensureAdmin();
  const type = str(fd, "type") as MediaType;
  const tmdbType = str(fd, "tmdbType") as TmdbMediaType;
  const tmdbId = int(fd, "tmdbId");
  if (!type || !tmdbType || !tmdbId) throw new Error("Truksta duomenu");

  const id = await importFromTmdb({ type, tmdbType, tmdbId });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// Pazymeti kaip paziureta (is watchlist -> watched). Prideda WatchLog,
// padidina watchCount, atnaujina datas.
export async function markWatchedAction(fd: FormData) {
  await ensureAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  const media = await db.mediaItem.findUnique({ where: { id } });
  if (!media) throw new Error("Nerasta");

  const now = new Date();
  await db.mediaItem.update({
    where: { id },
    data: {
      status: "WATCHED",
      watchCount: media.status === "WATCHLIST" ? 1 : media.watchCount + 1,
      firstWatched: media.firstWatched ?? now,
      lastWatched: now,
    },
  });
  await db.watchLog.create({ data: { mediaId: id, watchedAt: now } });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// Parsiusti/atnaujinti asmens biografija ir filmografija is TMDB (Faze 4b)
export async function cachePersonAction(fd: FormData) {
  await ensureAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  await cachePersonWorks(id);
  revalidatePath("/", "layout");
  redirect(`/asmuo/${id}`);
}

// Atnaujinti is saltinio (TMDB) - priverstinis perparsiuntimas
export async function refreshMediaAction(fd: FormData) {
  await ensureAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  const media = await db.mediaItem.findUnique({ where: { id } });
  if (!media?.tmdbId) throw new Error("Nera TMDB saltinio");
  const tmdbType: TmdbMediaType =
    media.type === "SERIES" || media.type === "ANIME" ? "tv" : "movie";
  await importFromTmdb({ type: media.type, tmdbType, tmdbId: media.tmdbId });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}
