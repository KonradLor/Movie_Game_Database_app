"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { MediaType, Visibility, MediaStatus, GamePlatform, Prisma } from "@prisma/client";
import { db } from "./db";
import { getCurrentUser } from "./current-user";
import { resolveTmdb, resolveTwitch } from "./api-keys";
import { importFromTmdb, importFromIgdb } from "./media-cache";
import { cachePersonWorks } from "./people-cache";
import { tmdbLang } from "./locale";
import type { TmdbMediaType } from "./tmdb";

// Bet kuris PRISIJUNGES vartotojas gali tvarkyti SAVO dienorasti.
async function ensureUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Reikia prisijungti");
  return user;
}

// Patvirtina, kad irasas priklauso DABARTINIAM vartotojui (kitaip - klaida).
async function ensureOwned(id: string, userId: string) {
  const owned = await db.mediaItem.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Irasas nerastas arba ne jusu");
  return owned;
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
function float(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) !== null;
}

// Zaidimo laukai is FormData (tik jei tipas GAME; kitaip null/false).
function gameFields(fd: FormData, type: MediaType | null | undefined) {
  const isGame = type === "GAME";
  return {
    platform: isGame ? ((str(fd, "platform") as GamePlatform | null) ?? null) : null,
    playedHours: isGame ? float(fd, "playedHours") : null,
    beatenHours: isGame ? float(fd, "beatenHours") : null,
    platinum: isGame ? bool(fd, "platinum") : false,
  };
}

// Ziurejimo laukai is FormData (REDAGUOJANT). Zaidimams formoje sie laukai
// NErodomi, tad ju NEnusiunciam ir NEkeiciam (undefined = palikti kaip yra) -
// kitaip redaguojant zaidima tyliai istrintume firstWatched/lastWatched
// (jos legaliai atsiranda per "pazymeti ziuretu") ir durationMin.
function watchFieldsUpdate(fd: FormData, type: MediaType | null | undefined) {
  if (type === "GAME") {
    return {
      durationMin: undefined,
      watchCount: undefined,
      firstWatched: undefined,
      lastWatched: undefined,
    };
  }
  return {
    durationMin: int(fd, "durationMin"),
    watchCount: int(fd, "watchCount") ?? undefined,
    firstWatched: date(fd, "firstWatched"),
    lastWatched: date(fd, "lastWatched"),
  };
}

async function syncTagsFromString(mediaId: string, tagsCsv: string | null) {
  const names = (tagsCsv || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
  const user = await ensureUser();

  const type = (str(fd, "type") as MediaType) || "MOVIE";
  const media = await db.mediaItem.create({
    data: {
      userId: user.id,
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
      activityAt: new Date(), // naujas irasas = veikla (sekimo srautui)
      ...gameFields(fd, type),
    },
  });

  await syncTagsFromString(media.id, str(fd, "tags"));
  revalidatePath("/", "layout");
  redirect("/");
}

// ----------------------------------------------------------------------
// Redagavimas (tik savo iraso)
// ----------------------------------------------------------------------
export async function updateMedia(fd: FormData) {
  const user = await ensureUser();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  const existing = await ensureOwned(id, user.id);

  const newType = (str(fd, "type") as MediaType) || undefined;
  const newStatus = (str(fd, "status") as MediaStatus) || undefined;
  // Perejimas i WATCHED per redagavimo forma (ne markWatched mygtuka) = veikla,
  // kad ir sitas kelias issoktu i sekimo srauto virsu (suderinta su markWatched).
  const becameWatched = newStatus === "WATCHED" && existing.status !== "WATCHED";

  await db.mediaItem.update({
    where: { id },
    data: {
      type: newType,
      title: str(fd, "title") || undefined,
      originalTitle: str(fd, "originalTitle"),
      year: int(fd, "year"),
      description: str(fd, "description"),
      posterUrl: str(fd, "posterUrl"),
      rating: int(fd, "rating"),
      opinion: str(fd, "opinion"),
      status: newStatus,
      visibility: (str(fd, "visibility") as Visibility) || undefined,
      ...watchFieldsUpdate(fd, newType),
      ...gameFields(fd, newType),
      ...(becameWatched ? { activityAt: new Date() } : {}),
    },
  });

  await syncTagsFromString(id, str(fd, "tags"));
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// ----------------------------------------------------------------------
// Trynimas (tik savo iraso)
// ----------------------------------------------------------------------
export async function deleteMedia(fd: FormData) {
  const user = await ensureUser();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  await ensureOwned(id, user.id);
  await db.mediaItem.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/");
}

// ----------------------------------------------------------------------
// TMDB importas (write-through cache) - i SAVO dienorasti
// ----------------------------------------------------------------------
export async function importTmdbAction(fd: FormData) {
  const user = await ensureUser();
  const type = str(fd, "type") as MediaType;
  const tmdbType = str(fd, "tmdbType") as TmdbMediaType;
  const tmdbId = int(fd, "tmdbId");
  if (!type || !tmdbType || !tmdbId) throw new Error("Truksta duomenu");

  const tmdb = resolveTmdb(user);
  if (!tmdb.canSearch) throw new Error("Reikia įvesti savo TMDB raktus profilyje");
  const id = await importFromTmdb({
    userId: user.id,
    type,
    tmdbType,
    tmdbId,
    readToken: tmdb.readToken ?? undefined,
    allowAdult: user.allowAdult,
  });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// ----------------------------------------------------------------------
// IGDB importas (zaidimai) - i SAVO dienorasti
// ----------------------------------------------------------------------
export async function importIgdbAction(fd: FormData) {
  const user = await ensureUser();
  const igdbId = int(fd, "igdbId");
  if (!igdbId) throw new Error("Truksta duomenu");

  const twitch = resolveTwitch(user);
  if (!twitch.canSearch || !twitch.clientId || !twitch.clientSecret) {
    throw new Error("Reikia įvesti savo Twitch/IGDB raktus profilyje");
  }
  const id = await importFromIgdb({
    userId: user.id,
    igdbId,
    creds: { clientId: twitch.clientId, clientSecret: twitch.clientSecret },
    allowAdult: user.allowAdult,
  });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// Atnaujinti VISUS savo saltiniu (TMDB/IGDB) irasus - uzpildo visas 3 kalbas.
// Skirta senai (vienakalbei) bibliotekai "pakelti" i daugiakalbe. Sugede irasai
// praleidziami (pvz. adult be leidimo), batchas nenutraukiamas.
export async function refreshAllMediaAction() {
  const user = await ensureUser();
  const items = await db.mediaItem.findMany({
    where: {
      userId: user.id,
      OR: [{ tmdbId: { not: null } }, { igdbId: { not: null } }],
    },
    select: { id: true, type: true, tmdbId: true, igdbId: true },
  });

  const tmdb = resolveTmdb(user);
  const twitch = resolveTwitch(user);

  for (const m of items) {
    try {
      if (m.igdbId) {
        if (twitch.canSearch && twitch.clientId && twitch.clientSecret) {
          await importFromIgdb({
            userId: user.id,
            igdbId: m.igdbId,
            creds: { clientId: twitch.clientId, clientSecret: twitch.clientSecret },
            allowAdult: user.allowAdult,
          });
        }
      } else if (m.tmdbId && tmdb.canSearch) {
        const tmdbType: TmdbMediaType =
          m.type === "SERIES" || m.type === "ANIME" ? "tv" : "movie";
        await importFromTmdb({
          userId: user.id,
          type: m.type,
          tmdbType,
          tmdbId: m.tmdbId,
          readToken: tmdb.readToken ?? undefined,
          allowAdult: user.allowAdult,
        });
      }
    } catch {
      // Praleisti sugedusi irasa, testi toliau.
    }
  }

  revalidatePath("/", "layout");
  redirect("/profilis");
}

// Pazymeti kaip paziureta (tik savo iraso)
export async function markWatchedAction(fd: FormData) {
  const user = await ensureUser();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  const media = await ensureOwned(id, user.id);

  const now = new Date();
  await db.mediaItem.update({
    where: { id },
    data: {
      status: "WATCHED",
      watchCount: media.status === "WATCHLIST" ? 1 : media.watchCount + 1,
      firstWatched: media.firstWatched ?? now,
      lastWatched: now,
      activityAt: now, // pazymejo ziureta = veikla (issoka i sekimo srauto virsu)
    },
  });
  await db.watchLog.create({ data: { mediaId: id, watchedAt: now } });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}

// Parsiusti/atnaujinti asmens filmografija (bendras cache) - reikia prisijungti
export async function cachePersonAction(fd: FormData) {
  const user = await ensureUser();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  const tmdb = resolveTmdb(user);
  if (!tmdb.canSearch) throw new Error("Reikia įvesti savo TMDB raktus profilyje");
  const locale = await getLocale();
  await cachePersonWorks(id, tmdb.readToken ?? undefined, tmdbLang(locale));
  revalidatePath("/", "layout");
  redirect(`/asmuo/${id}`);
}

// ----------------------------------------------------------------------
// FAZE C: savo API raktu issaugojimas (profilis)
// ----------------------------------------------------------------------
// Tusti laukai NEkeiciami (palieka esamus). Naudoti "Isvalyti" mygtuka istrynimui.
export async function saveApiKeysAction(fd: FormData) {
  const user = await ensureUser();
  const data: Prisma.UserUpdateInput = {};
  const fields = [
    "tmdbReadToken",
    "tmdbApiKey",
    "twitchClientId",
    "twitchClientSecret",
  ] as const;
  for (const f of fields) {
    const v = str(fd, f);
    if (v !== null) (data as Record<string, string>)[f] = v;
  }
  if (Object.keys(data).length > 0) {
    await db.user.update({ where: { id: user.id }, data });
  }
  revalidatePath("/profilis");
  redirect("/profilis");
}

export async function clearApiKeysAction() {
  const user = await ensureUser();
  await db.user.update({
    where: { id: user.id },
    data: {
      tmdbReadToken: null,
      tmdbApiKey: null,
      twitchClientId: null,
      twitchClientSecret: null,
    },
  });
  revalidatePath("/profilis");
  redirect("/profilis");
}

// Suaugusiuju turinio nustatymo issaugojimas (checkbox: yra -> leista).
export async function saveAdultPrefAction(fd: FormData) {
  const user = await ensureUser();
  const allow = fd.get("allowAdult") !== null;
  await db.user.update({ where: { id: user.id }, data: { allowAdult: allow } });
  revalidatePath("/", "layout");
  redirect("/profilis");
}

// Atnaujinti is saltinio - tik savo iraso. Zaidimai -> IGDB, kita -> TMDB.
// Atnaujinus TMDB irasa - uzpildomos VISOS 3 kalbos (senus vokiskus irasus
// tai "pakelia" i daugiakalbius).
export async function refreshMediaAction(fd: FormData) {
  const user = await ensureUser();
  const id = str(fd, "id");
  if (!id) throw new Error("Truksta id");
  const media = await ensureOwned(id, user.id);

  if (media.igdbId) {
    const twitch = resolveTwitch(user);
    if (!twitch.canSearch || !twitch.clientId || !twitch.clientSecret) {
      throw new Error("Reikia įvesti savo Twitch/IGDB raktus profilyje");
    }
    await importFromIgdb({
      userId: user.id,
      igdbId: media.igdbId,
      creds: { clientId: twitch.clientId, clientSecret: twitch.clientSecret },
      allowAdult: user.allowAdult,
    });
    revalidatePath("/", "layout");
    redirect(`/media/${id}`);
  }

  if (!media.tmdbId) throw new Error("Nera saltinio (rankinis irasas)");
  const tmdb = resolveTmdb(user);
  if (!tmdb.canSearch) throw new Error("Reikia įvesti savo TMDB raktus profilyje");
  const tmdbType: TmdbMediaType =
    media.type === "SERIES" || media.type === "ANIME" ? "tv" : "movie";
  await importFromTmdb({
    userId: user.id,
    type: media.type,
    tmdbType,
    tmdbId: media.tmdbId,
    readToken: tmdb.readToken ?? undefined,
    allowAdult: user.allowAdult,
  });
  revalidatePath("/", "layout");
  redirect(`/media/${id}`);
}
