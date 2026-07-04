// Zemo lygio IGDB klientas (zaidimai). Autentifikacija per Twitch app token
// (client_credentials). Token'ai kesuojami atmintyje ir atnaujinami pasibaigus.
// Dokumentacija: https://api-docs.igdb.com/

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";
const IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

// IGDB "Erotic" temos ID (suaugusiuju turinys). Patikrinta gyvai.
export const IGDB_EROTIC_THEME = 42;

export interface IgdbCreds {
  clientId: string;
  clientSecret: string;
}

// --- Token kesas (atmintyje, pagal clientId) ---
interface CachedToken {
  token: string;
  expiresAt: number; // ms epoch
}
const tokenCache = new Map<string, CachedToken>();

async function getAppToken(creds: IgdbCreds): Promise<string> {
  // Rakte ir secret - kad pakeitus secret (ta patį clientId) nebutu grazinamas
  // senas tokenas (ismintas su senu secret).
  const key = `${creds.clientId}:${creds.clientSecret}`;
  const cached = tokenCache.get(key);
  // 60s atsarga pries pasibaigima.
  if (cached && cached.expiresAt - 60_000 > Date.now()) {
    return cached.token;
  }
  const url =
    `${TWITCH_TOKEN_URL}?client_id=${encodeURIComponent(creds.clientId)}` +
    `&client_secret=${encodeURIComponent(creds.clientSecret)}` +
    `&grant_type=client_credentials`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Twitch token klaida ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(key, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}

// Bendra IGDB uzklausa (apicalypse kalba body'je).
async function igdbQuery<T>(creds: IgdbCreds, endpoint: string, body: string): Promise<T> {
  const token = await getAppToken(creds);
  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": creds.clientId,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`IGDB klaida ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ----------------------------------------------------------------------
// Tipai (tik tai, ka naudojam)
// ----------------------------------------------------------------------

export interface IgdbCompanyInvolvement {
  company?: { id: number; name: string };
  developer?: boolean;
  publisher?: boolean;
}

export interface IgdbGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number; // unix sekundes
  cover?: { image_id?: string };
  genres?: { id: number; name: string }[];
  themes?: number[];
  involved_companies?: IgdbCompanyInvolvement[];
}

// ----------------------------------------------------------------------
// Funkcijos
// ----------------------------------------------------------------------

const SEARCH_FIELDS =
  "fields name,summary,first_release_date,cover.image_id,themes; " +
  "where version_parent = null;";

export interface IgdbSearchOpts extends IgdbCreds {
  includeAdult?: boolean;
}

export async function searchGames(query: string, opts: IgdbSearchOpts): Promise<IgdbGame[]> {
  if (!query.trim()) return [];
  const body = `search "${query.replace(/"/g, '\\"')}"; ${SEARCH_FIELDS} limit 30;`;
  const games = await igdbQuery<IgdbGame[]>(opts, "games", body);
  const list = games || [];
  // Suaugusiuju filtras: atmetam Erotic tema, nebent aiskiai leista.
  const filtered = opts.includeAdult ? list : list.filter((g) => !isAdultGame(g));
  return filtered.slice(0, 20);
}

const DETAILS_FIELDS =
  "fields name,summary,storyline,first_release_date,cover.image_id," +
  "genres.name,themes,involved_companies.company.id," +
  "involved_companies.company.name,involved_companies.developer," +
  "involved_companies.publisher;";

export async function getGameDetails(id: number, creds: IgdbCreds): Promise<IgdbGame> {
  const body = `${DETAILS_FIELDS} where id = ${id}; limit 1;`;
  const rows = await igdbQuery<IgdbGame[]>(creds, "games", body);
  if (!rows || rows.length === 0) {
    throw new Error(`IGDB zaidimas ${id} nerastas`);
  }
  return rows[0];
}

// Ar zaidimas suaugusiuju (Erotic tema).
export function isAdultGame(game: IgdbGame): boolean {
  return Array.isArray(game.themes) && game.themes.includes(IGDB_EROTIC_THEME);
}

export function coverUrl(imageId?: string | null, size = "t_cover_big"): string | null {
  if (!imageId) return null;
  return `${IMAGE_BASE}/${size}/${imageId}.jpg`;
}

export function gameYear(game: IgdbGame): number | null {
  if (!game.first_release_date) return null;
  return new Date(game.first_release_date * 1000).getUTCFullYear();
}
