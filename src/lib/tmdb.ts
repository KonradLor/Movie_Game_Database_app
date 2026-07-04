// Zemo lygio TMDB API klientas. Naudoja v4 Read Access Token (Bearer).
// Dokumentacija: https://developer.themoviedb.org/

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

// Numatytoji kalba, jei nepaduota (fallback) - anglu.
const DEFAULT_LANG = "en-US";

// Bendros TMDB uzklausos parinktys.
export interface TmdbOpts {
  // Efektyvus v4 Read Token (FAZE C: pagal vartotoja). Nera -> fallback .env.
  token?: string;
  // TMDB "language" (pvz. en-US, de-DE, lt-LT). Nera -> en-US.
  lang?: string;
  // Ar itraukti suaugusiuju turini (numatytai NE - blokuojama).
  includeAdult?: boolean;
}

// token - efektyvus v4 Read Token (FAZE C: pagal vartotoja). Jei nepaduotas -
// fallback i .env (pvz. vidiniai/admin keliai). Nera nei vieno -> klaida.
function authHeaders(token?: string): HeadersInit {
  const t = token || process.env.TMDB_READ_TOKEN;
  if (!t) {
    throw new Error("TMDB raktas nenustatytas (nei vartotojo, nei serverio)");
  }
  return {
    Authorization: `Bearer ${t}`,
    accept: "application/json",
  };
}

async function tmdbGet<T>(
  path: string,
  params: Record<string, string> = {},
  opts: TmdbOpts = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("language", opts.lang || DEFAULT_LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: authHeaders(opts.token) });
  if (!res.ok) {
    throw new Error(`TMDB klaida ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ----------------------------------------------------------------------
// Tipai (tik tai, ka naudojam)
// ----------------------------------------------------------------------

export type TmdbMediaType = "movie" | "tv";

export interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string; // filmai
  name?: string; // serialai / asmenys
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  profile_path?: string | null; // asmenys
  release_date?: string; // filmai
  first_air_date?: string; // serialai
  adult?: boolean; // suaugusiuju turinys (filmai)
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCast {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

export interface TmdbCrew {
  id: number;
  name: string;
  job?: string;
  profile_path?: string | null;
}

export interface TmdbCompany {
  id: number;
  name: string;
  logo_path?: string | null;
}

export interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number; // filmai (min)
  episode_run_time?: number[]; // serialai
  adult?: boolean; // suaugusiuju turinys (filmai)
  genres?: TmdbGenre[];
  origin_country?: string[];
  production_companies?: TmdbCompany[];
  credits?: {
    cast?: TmdbCast[];
    crew?: TmdbCrew[];
  };
}

// ----------------------------------------------------------------------
// Funkcijos
// ----------------------------------------------------------------------

export async function searchMulti(query: string, opts: TmdbOpts = {}): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];
  const includeAdult = opts.includeAdult === true;
  const data = await tmdbGet<{ results: TmdbSearchResult[] }>(
    "/search/multi",
    { query, include_adult: includeAdult ? "true" : "false", page: "1" },
    opts
  );
  // Tik filmai ir serialai (asmenis tvarkysim Faze 4b atskirai).
  // Papildomas saugiklis: net jei include_adult praleido - atmetam adult=true.
  return (data.results || []).filter(
    (r) =>
      (r.media_type === "movie" || r.media_type === "tv") &&
      (includeAdult || r.adult !== true)
  );
}

export async function getDetails(
  type: TmdbMediaType,
  id: number,
  opts: TmdbOpts = {}
): Promise<TmdbDetails> {
  return tmdbGet<TmdbDetails>(`/${type}/${id}`, { append_to_response: "credits" }, opts);
}

export function posterUrl(path?: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

// --- Asmenys (Faze 4b) ---
export interface TmdbPersonWork {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  character?: string;
  job?: string;
  vote_count?: number;
}

export interface TmdbPerson {
  id: number;
  name: string;
  biography?: string;
  profile_path?: string | null;
  combined_credits?: {
    cast?: TmdbPersonWork[];
    crew?: TmdbPersonWork[];
  };
}

export async function getPerson(id: number, opts: TmdbOpts = {}): Promise<TmdbPerson> {
  return tmdbGet<TmdbPerson>(`/person/${id}`, { append_to_response: "combined_credits" }, opts);
}

// Pagalbinis: istraukti pagrindinius duomenis is detaliu
export function extractTitle(d: TmdbDetails | TmdbSearchResult): string {
  return d.title || d.name || "(be pavadinimo)";
}

export function extractYear(d: TmdbDetails): number | null {
  const date = d.release_date || d.first_air_date;
  if (!date) return null;
  const year = parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

export function extractRuntime(d: TmdbDetails): number | null {
  if (d.runtime) return d.runtime;
  if (d.episode_run_time && d.episode_run_time.length > 0) {
    return d.episode_run_time[0];
  }
  return null;
}
