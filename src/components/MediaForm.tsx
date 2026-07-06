"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MediaItem, Tag, TagOnMedia } from "@prisma/client";
import { createManualMedia, updateMedia } from "@/lib/actions";
import TmdbSearch from "@/components/TmdbSearch";
import IgdbSearch from "@/components/IgdbSearch";

type ItemWithTags = MediaItem & { tags?: (TagOnMedia & { tag: Tag })[] };

const TYPES = ["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"] as const;
const STATUSES = ["WATCHED", "WATCHLIST"] as const;
const VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;
const PLATFORMS = [
  "PC",
  "STEAM",
  "PLAYSTATION",
  "XBOX",
  "NINTENDO_SWITCH",
  "MOBILE",
  "OTHER",
] as const;

function dateValue(d?: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

// showSearch=true (tik pridedant) - virs formos rodo paieska pagal pasirinkta
// kategorija (zaidimams IGDB, kitiems TMDB). Redaguojant paieskos nera.
export default function MediaForm({
  item,
  showSearch = false,
}: {
  item?: ItemWithTags;
  showSearch?: boolean;
}) {
  const t = useTranslations();
  const isEdit = Boolean(item);
  const [type, setType] = useState<string>(item?.type ?? "MOVIE");
  const isGame = type === "GAME";
  // Tipai, kuriems galima "dabar zaidziu/ziuriu" busena (GAME/SERIES/ANIME).
  const canPlay = type === "GAME" || type === "SERIES" || type === "ANIME";
  const tagsCsv = item?.tags?.map((x) => x.tag.name).join(", ") || "";

  const labelCls = "block text-sm text-white/70 mb-1";
  const inputCls =
    "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none";
  const segCls = (on: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      on
        ? "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] text-white"
        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="space-y-8">
      {/* Kategorija - lemia ir paieskos saltini, ir rodomus laukus */}
      <div>
        <label className={labelCls}>{t("form.type")}</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setType(ty)}
              aria-pressed={type === ty}
              className={segCls(type === ty)}
            >
              {t(`type.${ty}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Paieska - tik pridedant nauja; saltinis pagal kategorija */}
      {showSearch && !isEdit && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-white/70">
            {isGame ? t("form.searchGames") : t("form.searchTmdb")}
          </h2>
          {isGame ? <IgdbSearch /> : <TmdbSearch />}
          <div className="flex items-center gap-3 pt-1 text-xs uppercase tracking-wide text-white/35">
            <span className="h-px flex-1 bg-white/10" />
            {t("form.orManual")}
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </section>
      )}

      <form
        action={isEdit ? updateMedia : createManualMedia}
        className="glass space-y-4 p-6"
      >
        {isEdit && <input type="hidden" name="id" value={item!.id} />}
        <input type="hidden" name="type" value={type} />

        {/* --- Bendri laukai (visiems tipams) --- */}
        <div>
          <label className={labelCls}>{t("form.title")}</label>
          <input name="title" defaultValue={item?.title || ""} className={inputCls} required />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("form.originalTitle")}</label>
            <input
              name="originalTitle"
              defaultValue={item?.originalTitle || ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("form.posterUrl")}</label>
            <input name="posterUrl" defaultValue={item?.posterUrl || ""} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelCls}>{t("form.year")}</label>
            <input
              name="year"
              type="number"
              defaultValue={item?.year ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("form.rating")}</label>
            <input
              name="rating"
              type="number"
              min="1"
              max="5"
              defaultValue={item?.rating ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("form.status")}</label>
            <select name="status" defaultValue={item?.status || "WATCHED"} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
              {canPlay && (
                <option value="PLAYING">
                  {t(isGame ? "now.statusPlayingGame" : "now.statusPlayingWatch")}
                </option>
              )}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("form.visibility")}</label>
            <select
              name="visibility"
              defaultValue={item?.visibility || "PUBLIC"}
              className={inputCls}
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {t(`visibility.${v}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Kategorijai specifiniai laukai --- */}
        {isGame ? (
          <fieldset key="game" className="rounded-lg border border-white/10 bg-white/5 p-4">
            <legend className="px-1 text-sm font-medium text-white/80">
              🎮 {t("gameFields.section")}
            </legend>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t("gameFields.platform")}</label>
                  <select name="platform" defaultValue={item?.platform ?? ""} className={inputCls}>
                    <option value="">—</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {t(`platform.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      name="platinum"
                      defaultChecked={item?.platinum ?? false}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    {t("gameFields.platinum")}
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t("gameFields.playedHours")}</label>
                  <input
                    name="playedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={item?.playedHours ?? ""}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("gameFields.beatenHours")}</label>
                  <input
                    name="beatenHours"
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={item?.beatenHours ?? ""}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </fieldset>
        ) : (
          <fieldset key="watch" className="rounded-lg border border-white/10 bg-white/5 p-4">
            <legend className="px-1 text-sm font-medium text-white/80">
              🎬 {t("form.watchInfo")}
            </legend>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t("form.duration")}</label>
                  <input
                    name="durationMin"
                    type="number"
                    defaultValue={item?.durationMin ?? ""}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("form.watchCount")}</label>
                  <input
                    name="watchCount"
                    type="number"
                    defaultValue={item?.watchCount ?? 1}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t("form.firstWatched")}</label>
                  <input
                    name="firstWatched"
                    type="date"
                    defaultValue={dateValue(item?.firstWatched)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("form.lastWatched")}</label>
                  <input
                    name="lastWatched"
                    type="date"
                    defaultValue={dateValue(item?.lastWatched)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* --- Bendri laukai (tesinys) --- */}
        <div>
          <label className={labelCls}>{t("form.tags")}</label>
          <input name="tags" defaultValue={tagsCsv} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{t("form.description")}</label>
          <textarea
            name="description"
            defaultValue={item?.description || ""}
            rows={3}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("form.opinion")}</label>
          <textarea
            name="opinion"
            defaultValue={item?.opinion || ""}
            rows={2}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {t("actions.save")}
        </button>
      </form>
    </div>
  );
}
