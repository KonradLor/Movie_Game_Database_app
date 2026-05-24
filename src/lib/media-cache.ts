// Write-through cache: parsiunciam is TMDB ir IS KARTO issaugom i DB.
// Po pirmo karto portalas skaito tik is DB. "Atnaujinti is saltinio" priverstinai
// perparsiunta metaduomenis (bet NEliecia asmenines info: rating, opinion, datu...).

import type { MediaType } from "@prisma/client";
import { db } from "./db";
import {
  getDetails,
  posterUrl,
  extractTitle,
  extractYear,
  extractRuntime,
  type TmdbMediaType,
  type TmdbDetails,
} from "./tmdb";

const MAX_CAST = 15;

export interface ImportInput {
  // Savininkas (i kurio dienorasti importuojam)
  userId: string;
  // Pageidaujama kategorija portale (anime/dok. nustato vartotojas)
  type: MediaType;
  // TMDB media tipas ir id
  tmdbType: TmdbMediaType;
  tmdbId: number;
}

// Parsiusti is TMDB ir issaugoti (sukurti arba atnaujinti metaduomenis).
export async function importFromTmdb(input: ImportInput): Promise<string> {
  const details = await getDetails(input.tmdbType, input.tmdbId);

  const title = extractTitle(details);
  const originalTitle = details.original_title || details.original_name || null;
  const year = extractYear(details);
  const durationMin = extractRuntime(details);
  const description = details.overview || null;
  const poster = posterUrl(details.poster_path);
  const genres = (details.genres || []).map((g) => g.name);

  // Upsert pagal (userId, type, tmdbId) - per-vartotojo. Atnaujinant - NElieciam asmenines info.
  const media = await db.mediaItem.upsert({
    where: {
      userId_type_tmdbId: { userId: input.userId, type: input.type, tmdbId: input.tmdbId },
    },
    update: {
      title,
      originalTitle,
      year,
      durationMin,
      description,
      posterUrl: poster,
      source: "TMDB",
      cachedAt: new Date(),
    },
    create: {
      userId: input.userId,
      type: input.type,
      title,
      originalTitle,
      year,
      durationMin,
      description,
      posterUrl: poster,
      source: "TMDB",
      tmdbId: input.tmdbId,
      cachedAt: new Date(),
    },
  });

  await syncTags(media.id, genres);
  await syncCredits(media.id, details);

  return media.id;
}

async function syncTags(mediaId: string, genreNames: string[]) {
  for (const name of genreNames) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await db.tagOnMedia.upsert({
      where: { mediaId_tagId: { mediaId, tagId: tag.id } },
      update: {},
      create: { mediaId, tagId: tag.id },
    });
  }
}

async function syncCredits(mediaId: string, details: TmdbDetails) {
  // Perkuriam sio iraso kreditus (saltinis - TMDB)
  await db.credit.deleteMany({ where: { mediaId } });

  const cast = (details.credits?.cast || []).slice(0, MAX_CAST);
  for (const c of cast) {
    const person = await db.person.upsert({
      where: { tmdbId: c.id },
      update: { name: c.name, photoUrl: posterUrl(c.profile_path) },
      create: { name: c.name, tmdbId: c.id, photoUrl: posterUrl(c.profile_path) },
    });
    await db.credit.create({
      data: {
        mediaId,
        personId: person.id,
        role: "ACTOR",
        character: c.character || null,
      },
    });
  }

  const crew = details.credits?.crew || [];
  for (const c of crew) {
    const role =
      c.job === "Director"
        ? "DIRECTOR"
        : c.job === "Writer" || c.job === "Screenplay"
          ? "WRITER"
          : null;
    if (!role) continue;
    const person = await db.person.upsert({
      where: { tmdbId: c.id },
      update: { name: c.name, photoUrl: posterUrl(c.profile_path) },
      create: { name: c.name, tmdbId: c.id, photoUrl: posterUrl(c.profile_path) },
    });
    await db.credit.create({
      data: { mediaId, personId: person.id, role },
    });
  }

  const companies = details.production_companies || [];
  for (const co of companies) {
    const company = await db.company.upsert({
      where: { tmdbId: co.id },
      update: { name: co.name, logoUrl: posterUrl(co.logo_path) },
      create: { name: co.name, tmdbId: co.id, logoUrl: posterUrl(co.logo_path) },
    });
    await db.credit.create({
      data: { mediaId, companyId: company.id, role: "STUDIO" },
    });
  }
}
