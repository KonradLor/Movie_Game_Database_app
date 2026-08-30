import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { dismissRecommendationAction } from "@/lib/social-actions";

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const t = await getTranslations();

  const recs = await db.recommendation.findMany({
    where: { toId: user.id },
    include: { from: true, media: { select: { id: true, visibility: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Pazymim perskaitytomis (badge nav juostoje isvalomas kitam apsilankymui).
  // recs jau atmintyje - "nauja" zymos parodomos dar sioje perziuroje.
  if (recs.some((r) => r.readAt === null)) {
    await db.recommendation.updateMany({
      where: { toId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  const fromLabel = (u: { name: string | null; userNumber: number }) =>
    u.name || `#${u.userNumber}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gradient text-2xl font-bold">{t("rec.title")}</h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← {t("friends.back")}
        </Link>
      </div>
      <p className="mb-6 text-sm text-white/45">{t("rec.inboxHint")}</p>

      {recs.length === 0 ? (
        <section className="glass flex min-h-[30vh] items-center justify-center p-10 text-center">
          <p className="text-white/45">{t("rec.empty")}</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {recs.map((r) => {
            const linkable = r.media && r.media.visibility === "PUBLIC";
            return (
              <li key={r.id} className="glass flex gap-4 p-4">
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {r.mediaPoster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.mediaPoster} alt={r.mediaTitle} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                      {t(`type.${r.mediaType}`)}
                    </span>
                    <span className="font-medium">{r.mediaTitle}</span>
                    {r.readAt === null && (
                      <span className="rounded-full bg-[var(--color-accent)]/25 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                        {t("rec.new")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/45">
                    {t("rec.from")} <span className="text-white/70">{fromLabel(r.from)}</span>
                    <span className="text-white/30"> · {r.createdAt.toISOString().slice(0, 10)}</span>
                  </p>
                  {r.message && (
                    <p className="mt-2 rounded-lg bg-white/5 p-2.5 text-sm italic text-white/80">
                      “{r.message}”
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {linkable && (
                      <Link
                        href={`/media/${r.media!.id}`}
                        className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/20"
                      >
                        {t("rec.viewDetails")}
                      </Link>
                    )}
                    <form action={dismissRecommendationAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white/50 transition hover:bg-red-500/20 hover:text-red-300">
                        {t("rec.dismiss")}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
