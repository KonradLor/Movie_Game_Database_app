"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { importTmdbAction } from "@/lib/actions";

interface Result {
  tmdbId: number;
  tmdbType: "movie" | "tv";
  suggestedType: string;
  title: string;
  originalTitle: string;
  overview: string;
  year: string | null;
  poster: string | null;
}

// Tik TMDB tipai (zaidimai importuojami atskirai per IGDB).
const TYPES = ["MOVIE", "SERIES", "ANIME", "DOCUMENTARY"] as const;

export default function TmdbSearch() {
  const t = useTranslations();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [needKeys, setNeedKeys] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setNeedKeys(false);
    try {
      const res = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(q)}&lang=${locale}`
      );
      if (res.status === 403) {
        setNeedKeys(true);
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none";

  return (
    <div className="glass space-y-4 p-6">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("form.searchPlaceholder")}
          className={inputCls}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
        >
          {t("actions.search")}
        </button>
      </form>

      {loading && <p className="text-sm text-white/50">{t("home.loading")}</p>}

      {needKeys && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-200">{t("search.needKeysTitle")}</p>
          <p className="mt-1 text-amber-100/70">{t("search.needKeysBody")}</p>
          <Link
            href="/profilis"
            className="mt-3 inline-block rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/30"
          >
            {t("search.toProfile")}
          </Link>
        </div>
      )}

      {!loading && !needKeys && searched && results.length === 0 && (
        <p className="text-sm text-white/50">{t("form.noResults")}</p>
      )}

      <ul className="space-y-3">
        {results.map((r) => (
          <li
            key={`${r.tmdbType}-${r.tmdbId}`}
            className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-white/10">
              {r.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.poster} alt={r.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {r.title} {r.year && <span className="text-white/40">({r.year})</span>}
              </p>
              <p className="line-clamp-2 text-xs text-white/50">{r.overview}</p>

              <form action={importTmdbAction} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="tmdbId" value={r.tmdbId} />
                <input type="hidden" name="tmdbType" value={r.tmdbType} />
                <select
                  name="type"
                  defaultValue={r.suggestedType}
                  className="rounded bg-white/10 px-2 py-1 text-xs text-white"
                >
                  {TYPES.map((ty) => (
                    <option key={ty} value={ty}>
                      {t(`type.${ty}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
                >
                  {t("actions.import")}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
