import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { pickText } from "@/lib/locale";
import { deleteMedia, refreshMediaAction, markWatchedAction } from "@/lib/actions";

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();
  const user = await getCurrentUser();

  // Tik SAVO irasa rodom (daugiavartotojiskumas)
  const item = await db.mediaItem.findFirst({
    where: { id, userId: user?.id ?? "__no_user__" },
    include: {
      tags: { include: { tag: true } },
      credits: { include: { person: true, company: true } },
    },
  });

  if (!item) notFound();
  // Savininkas gali tvarkyti savo irasa
  const admin = !!user;
  const { title, description } = pickText(item, locale);

  const actors = item.credits.filter((c) => c.role === "ACTOR" && c.person);
  const directors = item.credits.filter((c) => c.role === "DIRECTOR" && c.person);
  const studios = item.credits.filter((c) => c.role === "STUDIO" && c.company);
  const developers = item.credits.filter((c) => c.role === "DEVELOPER" && c.company);
  const publishers = item.credits.filter((c) => c.role === "PUBLISHER" && c.company);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← {t("actions.back")}
        </Link>
        {admin && (
          <div className="flex items-center gap-2">
            {item.status === "WATCHLIST" && (
              <form action={markWatchedAction}>
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/30">
                  ✓ {t("watchlist.markWatched")}
                </button>
              </form>
            )}
            <Link
              href={`/media/${item.id}/redaguoti`}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              {t("actions.edit")}
            </Link>
            {(item.tmdbId || item.igdbId) && (
              <form action={refreshMediaAction}>
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
                  {t("actions.refresh")}
                </button>
              </form>
            )}
            <form action={deleteMedia}>
              <input type="hidden" name="id" value={item.id} />
              <button className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/30">
                {t("actions.delete")}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="glass flex flex-col gap-6 p-6 sm:flex-row">
        <div className="mx-auto w-48 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:mx-0">
          {item.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.posterUrl} alt={title} className="w-full" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center text-xs text-white/30">
              —
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          {item.originalTitle && item.originalTitle !== title && (
            <p className="text-sm text-white/40">{item.originalTitle}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-white/10 px-2 py-0.5">{t(`type.${item.type}`)}</span>
            {item.year && <span className="text-white/60">{item.year}</span>}
            {item.durationMin && (
              <span className="text-white/60">
                {item.durationMin} {t("card.minutes")}
              </span>
            )}
            <span className="rounded bg-white/5 px-2 py-0.5 text-white/50">
              {t(`visibility.${item.visibility}`)}
            </span>
          </div>

          {item.rating && (
            <p className="mt-2 text-[var(--color-accent)]">{"★".repeat(item.rating)}</p>
          )}
          <p className="mt-1 text-sm text-white/60">
            {t("card.watchedTimes", { count: item.watchCount })}
          </p>

          {/* Zaidimo asmeniniai duomenys */}
          {item.type === "GAME" &&
            (item.platform || item.playedHours != null || item.beatenHours != null || item.platinum) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {item.platform && (
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white/70">
                    {t(`platform.${item.platform}`)}
                  </span>
                )}
                {item.playedHours != null && (
                  <span className="text-white/60">
                    {t("gameFields.playedHours")}: {item.playedHours} h
                  </span>
                )}
                {item.beatenHours != null && (
                  <span className="text-white/60">
                    {t("gameFields.beatenHours")}: {item.beatenHours} h
                  </span>
                )}
                {item.platinum && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-medium text-amber-300">
                    🏆 {t("gameFields.platinum")}
                  </span>
                )}
              </div>
            )}

          {item.opinion && (
            <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm italic text-white/80">
              {item.opinion}
            </p>
          )}
          {description && (
            <p className="mt-3 text-sm text-white/70">{description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((x) => (
                <span key={x.tagId} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {x.tag.name}
                </span>
              ))}
            </div>
          )}

          {directors.length > 0 && (
            <p className="mt-3 text-sm text-white/60">
              <span className="text-white/40">{t("credits.directors")} </span>
              {directors.map((c, idx) => (
                <span key={c.id}>
                  {idx > 0 && ", "}
                  <Link href={`/asmuo/${c.person!.id}`} className="hover:text-white hover:underline">
                    {c.person!.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {actors.length > 0 && (
            <p className="mt-1 text-sm text-white/60">
              <span className="text-white/40">{t("credits.cast")} </span>
              {actors.slice(0, 8).map((c, idx) => (
                <span key={c.id}>
                  {idx > 0 && ", "}
                  <Link href={`/asmuo/${c.person!.id}`} className="hover:text-white hover:underline">
                    {c.person!.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {studios.length > 0 && (
            <p className="mt-1 text-sm text-white/60">
              <span className="text-white/40">{t("credits.studios")} </span>
              {studios.map((c, idx) => (
                <span key={c.id}>
                  {idx > 0 && ", "}
                  <Link href={`/studija/${c.company!.id}`} className="hover:text-white hover:underline">
                    {c.company!.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {developers.length > 0 && (
            <p className="mt-1 text-sm text-white/60">
              <span className="text-white/40">{t("credits.developers")} </span>
              {developers.map((c, idx) => (
                <span key={c.id}>
                  {idx > 0 && ", "}
                  <Link href={`/studija/${c.company!.id}`} className="hover:text-white hover:underline">
                    {c.company!.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {publishers.length > 0 && (
            <p className="mt-1 text-sm text-white/60">
              <span className="text-white/40">{t("credits.publishers")} </span>
              {publishers.map((c, idx) => (
                <span key={c.id}>
                  {idx > 0 && ", "}
                  <Link href={`/studija/${c.company!.id}`} className="hover:text-white hover:underline">
                    {c.company!.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
