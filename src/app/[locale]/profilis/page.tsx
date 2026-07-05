import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { totalHoursOf } from "@/lib/stats";
import { getCurrentUser } from "@/lib/current-user";
import { resolveTmdb, resolveTwitch, ownKeysRequired, SHARED_KEY_LIMIT } from "@/lib/api-keys";
import { toTheme, THEME_COOKIE } from "@/lib/theme";
import {
  saveApiKeysAction,
  clearApiKeysAction,
  saveAdultPrefAction,
  refreshAllMediaAction,
} from "@/lib/actions";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const t = await getTranslations("profile");
  const tRoot = await getTranslations();

  const tmdb = resolveTmdb(user);
  const twitch = resolveTwitch(user);
  const required = ownKeysRequired(user.userNumber);
  const theme = toTheme((await cookies()).get(THEME_COOKIE)?.value);

  // Bendras praleistas laikas (santrauka; pilnas isskaidymas - Statistikoje)
  const watched = await db.mediaItem.findMany({
    where: { userId: user.id, status: "WATCHED" },
    select: { type: true, durationMin: true, watchCount: true, playedHours: true },
  });
  const totalHours = totalHoursOf(watched);

  const setLabel = (v: string | null) => (v ? t("set") : t("notSet"));

  const sourceText = (src: string) => {
    if (src === "missing-required")
      return { text: t("srcRequired"), cls: "text-red-300 bg-red-500/15" };
    if (src === "own")
      return { text: t("srcOwn"), cls: "text-emerald-300 bg-emerald-500/15" };
    return { text: t("srcShared"), cls: "text-white/60 bg-white/10" };
  };
  const tmdbS = sourceText(tmdb.source);
  const twitchS = sourceText(twitch.source);

  const inputCls =
    "mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-[var(--color-accent)]";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gradient text-2xl font-bold">{t("title")}</h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← {t("back")}
        </Link>
      </div>

      {/* Vartotojo info */}
      <section className="glass mb-6 p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-white/50">
            {t("user")}: <span className="text-white/90">{user.name || user.email}</span>
          </span>
          <span className="text-white/50">
            {t("number")} <span className="text-white/90">#{user.userNumber}</span>
          </span>
          {user.isAdmin && (
            <span className="rounded-full bg-[var(--color-accent)]/20 px-2 py-0.5 text-xs text-[var(--color-accent)]">
              {t("adminBadge")}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-white/45">
          {required
            ? t("requiredInfo", { number: user.userNumber, limit: SHARED_KEY_LIMIT })
            : t("sharedInfo", { limit: SHARED_KEY_LIMIT })}
        </p>
      </section>

      {/* Bendras laikas (santrauka -> Statistika) */}
      <section className="glass mb-6 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white/80">{t("totalTimeHeading")}</h2>
            <p className="mt-1 text-3xl font-bold">
              {totalHours}{" "}
              <span className="text-base font-normal text-white/50">
                {tRoot("stats.hoursUnit")}
              </span>
            </p>
          </div>
          <Link
            href="/statistika"
            className="text-sm text-[var(--color-accent)] transition hover:brightness-125"
          >
            {t("viewStats")}
          </Link>
        </div>
      </section>

      {/* Kalba (perjungiama viršuje per vėliavėles) + esamų įrašų atnaujinimas */}
      <section className="glass mb-6 p-6">
        <h2 className="text-sm font-semibold text-white/80">{t("langHeading")}</h2>
        <p className="mt-1 text-xs text-white/45">{t("langHint")}</p>

        {/* Masinis atnaujinimas - senus vienakalbius irasus paverciam daugiakalbiais */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold text-white/70">{t("refreshAllHeading")}</h3>
          <p className="mt-1 text-xs text-white/45">{t("refreshAllHint")}</p>
          <form action={refreshAllMediaAction} className="mt-3">
            <button
              type="submit"
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              ↻ {t("refreshAll")}
            </button>
          </form>
        </div>
      </section>

      {/* Tema */}
      <section className="glass mb-6 p-6">
        <h2 className="text-sm font-semibold text-white/80">{t("themeHeading")}</h2>
        <p className="mt-1 text-xs text-white/45">{t("themeHint")}</p>
        <div className="mt-4">
          <ThemeSwitcher initial={theme} variant="full" />
        </div>
      </section>

      {/* Suaugusiuju turinys */}
      <section className="glass mb-6 p-6">
        <h2 className="text-sm font-semibold text-white/80">{t("adultHeading")}</h2>
        <form action={saveAdultPrefAction} className="mt-3">
          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              name="allowAdult"
              defaultChecked={user.allowAdult}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {t("adultToggle")}
          </label>
          <p className="mt-2 text-xs text-white/45">{t("adultHint")}</p>
          <button
            type="submit"
            className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
          >
            {t("saveKeys")}
          </button>
        </form>
      </section>

      {/* Raktų forma */}
      <form action={saveApiKeysAction} className="glass space-y-6 p-6">
        {/* TMDB */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">{t("tmdbHeading")}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${tmdbS.cls}`}>{tmdbS.text}</span>
          </div>
          <label className="block text-xs text-white/50">
            {t("readToken")} — {setLabel(user.tmdbReadToken)}
          </label>
          <input
            type="password"
            name="tmdbReadToken"
            autoComplete="off"
            placeholder={t("keyPlaceholder")}
            className={inputCls}
          />
          <label className="mt-3 block text-xs text-white/50">
            {t("apiKey")} — {setLabel(user.tmdbApiKey)}
          </label>
          <input
            type="password"
            name="tmdbApiKey"
            autoComplete="off"
            placeholder={t("keyPlaceholder")}
            className={inputCls}
          />
        </div>

        {/* Twitch / IGDB */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">{t("twitchHeading")}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${twitchS.cls}`}>{twitchS.text}</span>
          </div>
          <label className="block text-xs text-white/50">
            {t("clientId")} — {setLabel(user.twitchClientId)}
          </label>
          <input
            type="password"
            name="twitchClientId"
            autoComplete="off"
            placeholder={t("keyPlaceholder")}
            className={inputCls}
          />
          <label className="mt-3 block text-xs text-white/50">
            {t("clientSecret")} — {setLabel(user.twitchClientSecret)}
          </label>
          <input
            type="password"
            name="twitchClientSecret"
            autoComplete="off"
            placeholder={t("keyPlaceholder")}
            className={inputCls}
          />
        </div>

        <p className="text-xs text-white/40">{t("emptyHint")}</p>

        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {t("saveKeys")}
        </button>
      </form>

      {/* Isvalyti */}
      <form action={clearApiKeysAction} className="mt-4">
        <button
          type="submit"
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:bg-red-500/20 hover:text-red-300"
        >
          {t("clearKeys")}
        </button>
      </form>
    </main>
  );
}
