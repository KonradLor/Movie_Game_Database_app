// Write-through cache: parsiunciam is TMDB/IGDB ir IS KARTO issaugom i DB.
// Po pirmo karto portalas skaito tik is DB. "Atnaujinti is saltinio" priverstinai
// perparsiunta metaduomenis (bet NEliecia asmenines info: rating, opinion, datu...).
//
// Daugiakalbis turinys: TMDB importas parsiunta title/overview VISOMIS 3 kalbomis
// (en/de/lt) ir issaugo i MediaItem.translations. Baziniai title/description = EN.
// Suaugusiuju turinys: jei adult ir vartotojui neleista - importas atmetamas.

import type { MediaType, Prisma } from "@prisma/client";
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
import {
  getGameDetails,
  isAdultGame,
  coverUrl,
  gameYear,
  type IgdbGame,
  type IgdbCreds,
} from "./igdb";
import { APP_LOCALES, tmdbLang, type MediaTranslations } from "./locale";

const MAX_CAST = 15;

// Zenklas, kad importas atmestas del suaugusiuju turinio (gaudo UI/action).
export const ADULT_BLOCKED = "adultBlocked";

export interface ImportInput {
  // Savininkas (i kurio dienorasti importuojam)
  userId: string;
  // Pageidaujama kategorija portale (anime/dok. nustato vartotojas)
  type: MediaType;
  // TMDB media tipas ir id
  tmdbType: TmdbMediaType;
  tmdbId: number;
  // Efektyvus TMDB v4 read token (FAZE C: pagal vartotoja). Nebutina - fallback env.
  readToken?: string;
  // Ar vartotojui leista suaugusiuju turinys (numatytai NE).
  allowAdult?: boolean;
}

// Parsiusti is TMDB (3 kalbomis) ir issaugoti (sukurti arba atnaujinti metaduomenis).
export async function importFromTmdb(input: ImportInput): Promise<string> {
  // Parsiunciam detales visomis 3 UI kalbomis lygiagreciai.
  const byLocale = await Promise.all(
    APP_LOCALES.map((loc) =>
      getDetails(input.tmdbType, input.tmdbId, {
        token: input.readToken,
        lang: tmdbLang(loc),
        includeAdult: input.allowAdult === true,
      }).then((d) => [loc, d] as const)
    )
  );
  const details: Record<string, TmdbDetails> = Object.fromEntries(byLocale);
  const en = details.en;

  // Suaugusiuju blokas (filmams TMDB grazina adult vėliavą).
  if (!input.allowAdult && en.adult === true) {
    throw new Error(ADULT_BLOCKED);
  }

  // Baziniai laukai - is EN (numatytoji/fallback kalba).
  const title = extractTitle(en);
  const originalTitle = en.original_title || en.original_name || null;
  const year = extractYear(en);
  const durationMin = extractRuntime(en);
  const description = en.overview || null;
  const poster = posterUrl(en.poster_path);
  const genres = (en.genres || []).map((g) => g.name);

  // Daugiakalbis turinys (be undefined reiksmiu - JSON draugiskiau).
  const translations: MediaTranslations = {};
  for (const loc of APP_LOCALES) {
    const d = details[loc];
    const entry: { title: string; description?: string } = { title: extractTitle(d) };
    if (d.overview) entry.description = d.overview;
    translations[loc] = entry;
  }

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
      translations: translations as Prisma.InputJsonValue,
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
      translations: translations as Prisma.InputJsonValue,
      source: "TMDB",
      tmdbId: input.tmdbId,
      cachedAt: new Date(),
      activityAt: new Date(), // pridejimas = veikla (NE atnaujinant - zr. update)
    },
  });

  await syncTags(media.id, genres);
  await syncCredits(media.id, en);

  return media.id;
}

// ----------------------------------------------------------------------
// IGDB (zaidimai)
// ----------------------------------------------------------------------

export interface ImportGameInput {
  userId: string;
  igdbId: number;
  creds: IgdbCreds;
  allowAdult?: boolean;
}

export async function importFromIgdb(input: ImportGameInput): Promise<string> {
  const game = await getGameDetails(input.igdbId, input.creds);

  if (!input.allowAdult && isAdultGame(game)) {
    throw new Error(ADULT_BLOCKED);
  }

  const title = game.name;
  const description = game.summary || game.storyline || null;
  const year = gameYear(game);
  const poster = coverUrl(game.cover?.image_id);
  const genres = (game.genres || []).map((g) => g.name);

  // IGDB turinys tik anglu -> issaugom kaip EN. Rodant, de/lt kris atgal i EN.
  const enEntry: { title: string; description?: string } = { title };
  if (description) enEntry.description = description;
  const translations: MediaTranslations = { en: enEntry };

  const media = await db.mediaItem.upsert({
    where: {
      userId_type_igdbId: { userId: input.userId, type: "GAME", igdbId: input.igdbId },
    },
    update: {
      title,
      year,
      description,
      posterUrl: poster,
      translations: translations as Prisma.InputJsonValue,
      source: "IGDB",
      cachedAt: new Date(),
    },
    create: {
      userId: input.userId,
      type: "GAME",
      title,
      year,
      description,
      posterUrl: poster,
      translations: translations as Prisma.InputJsonValue,
      source: "IGDB",
      igdbId: input.igdbId,
      cachedAt: new Date(),
      activityAt: new Date(), // pridejimas = veikla (NE atnaujinant)
    },
  });

  await syncTags(media.id, genres);
  await syncGameCredits(media.id, game);

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

// IGDB zaidimo kreditai: kompanijos su developer/publisher vaidmenimis.
async function syncGameCredits(mediaId: string, game: IgdbGame) {
  await db.credit.deleteMany({ where: { mediaId } });

  for (const inv of game.involved_companies || []) {
    if (!inv.company?.id) continue;
    const company = await db.company.upsert({
      where: { igdbId: inv.company.id },
      update: { name: inv.company.name },
      create: { name: inv.company.name, igdbId: inv.company.id },
    });
    if (inv.developer) {
      await db.credit.create({
        data: { mediaId, companyId: company.id, role: "DEVELOPER" },
      });
    }
    if (inv.publisher) {
      await db.credit.create({
        data: { mediaId, companyId: company.id, role: "PUBLISHER" },
      });
    }
  }
}
