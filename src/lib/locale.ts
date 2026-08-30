// Bendra kalbu logika: leidziamos UI kalbos, TMDB kalbos atvaizdis ir
// daugiakalbio turinio (MediaItem.translations) parinkimas su EN atsargine.

export const APP_LOCALES = ["en", "lt", "de"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

// UI kalba -> TMDB "language" parametras.
export const TMDB_LANG: Record<AppLocale, string> = {
  en: "en-US",
  de: "de-DE",
  lt: "lt-LT",
};

export function toAppLocale(l: string | null | undefined): AppLocale {
  return (APP_LOCALES as readonly string[]).includes(l ?? "")
    ? (l as AppLocale)
    : DEFAULT_LOCALE;
}

export function tmdbLang(locale: string | null | undefined): string {
  return TMDB_LANG[toAppLocale(locale)];
}

// Vieno iraso viena kalba: { title, description }.
export interface LocalizedText {
  title?: string;
  description?: string;
}
export type MediaTranslations = Partial<Record<AppLocale, LocalizedText>>;

// Parenka title/description pagal UI kalba. Tvarka: pasirinkta kalba ->
// EN (numatytoji/fallback) -> baziniai laukai (title/description stulpeliai).
export function pickText(
  item: { title: string; description: string | null; translations?: unknown },
  locale: string | null | undefined
): { title: string; description: string | null } {
  const loc = toAppLocale(locale);
  const tr = (item.translations ?? null) as MediaTranslations | null;
  const chosen = tr?.[loc];
  const en = tr?.en;
  return {
    title: chosen?.title || en?.title || item.title,
    description: chosen?.description || en?.description || item.description || null,
  };
}
