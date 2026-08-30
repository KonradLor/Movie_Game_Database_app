// FAZE C: API raktų sprendimas pagal vartotoją.
// Logika:
//   - Vartotojai 1-20 (userNumber <= SHARED_LIMIT): jei turi SAVO raktus -> savo;
//     kitaip -> BENDRI serverio raktai (.env).
//   - 21-as ir vėliau (userNumber > SHARED_LIMIT): TIK savo raktai. Jei nėra ->
//     canSearch=false (nauja TMDB/IGDB paieška/importas negalimas).
// Pure funkcijos (be DB) - kvietėjas paduoda vartotojo laukus.

import type { CurrentUser } from "./current-user";

// Kiek vartotojų gali naudotis bendrais raktais (įskaitant admin #1).
export const SHARED_KEY_LIMIT = 20;

export type KeySource = "shared" | "own" | "missing-required";

export interface TmdbResolved {
  readToken: string | null;
  apiKey: string | null;
  canSearch: boolean; // ar galima TMDB paieška/importas
  usingOwn: boolean; // ar naudojami savi raktai
  source: KeySource;
}

export interface TwitchResolved {
  clientId: string | null;
  clientSecret: string | null;
  canSearch: boolean;
  usingOwn: boolean;
  source: KeySource;
}

// Bendras sprendimo branduolys (TMDB ir Twitch ta pati logika).
// requireBoth=true (Twitch/IGDB): "savi raktai" laikomi tik kai yra ABU (ID+secret).
// Kitaip vartotojas, ivedes tik viena is dvieju, uzsiblokuotu ir NEnukristu i bendrus.
function resolve(
  userNumber: number,
  own: { a: string | null; b: string | null },
  shared: { a: string | null; b: string | null },
  requireBoth = false
): { a: string | null; b: string | null; canSearch: boolean; usingOwn: boolean; source: KeySource } {
  const hasOwn = requireBoth ? Boolean(own.a && own.b) : Boolean(own.a || own.b);
  const hasShared = requireBoth ? Boolean(shared.a && shared.b) : Boolean(shared.a || shared.b);

  // 1-20: savo (jei pilni) arba bendri
  if (userNumber <= SHARED_KEY_LIMIT) {
    if (hasOwn) return { a: own.a, b: own.b, canSearch: true, usingOwn: true, source: "own" };
    return { a: shared.a, b: shared.b, canSearch: hasShared, usingOwn: false, source: "shared" };
  }

  // 21+: TIK savo (pilni)
  if (hasOwn) return { a: own.a, b: own.b, canSearch: true, usingOwn: true, source: "own" };
  return { a: null, b: null, canSearch: false, usingOwn: false, source: "missing-required" };
}

export function resolveTmdb(user: Pick<CurrentUser, "userNumber" | "tmdbReadToken" | "tmdbApiKey">): TmdbResolved {
  const r = resolve(
    user.userNumber,
    { a: user.tmdbReadToken, b: user.tmdbApiKey },
    { a: process.env.TMDB_READ_TOKEN || null, b: process.env.TMDB_API_KEY || null }
  );
  return { readToken: r.a, apiKey: r.b, canSearch: r.canSearch, usingOwn: r.usingOwn, source: r.source };
}

export function resolveTwitch(
  user: Pick<CurrentUser, "userNumber" | "twitchClientId" | "twitchClientSecret">
): TwitchResolved {
  const r = resolve(
    user.userNumber,
    { a: user.twitchClientId, b: user.twitchClientSecret },
    { a: process.env.TWITCH_CLIENT_ID || null, b: process.env.TWITCH_CLIENT_SECRET || null },
    true // Twitch/IGDB reikia ABIEJU rakto (ID + secret)
  );
  return { clientId: r.a, clientSecret: r.b, canSearch: r.canSearch, usingOwn: r.usingOwn, source: r.source };
}

// Ar vartotojui PRIVALOMA įvesti savo raktus (yra 21+).
export function ownKeysRequired(userNumber: number): boolean {
  return userNumber > SHARED_KEY_LIMIT;
}
