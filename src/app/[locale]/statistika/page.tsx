import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { Link } from "@/i18n/navigation";
import type { MediaType, Prisma } from "@prisma/client";

const TYPES: MediaType[] = ["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"];

export default async function StatsPage() {
  const t = await getTranslations();
  const admin = await isAdmin();

  const where: Prisma.MediaItemWhereInput = { status: "WATCHED" };
  if (!admin) where.visibility = "PUBLIC";

  const items = await db.mediaItem.findMany({ where });

  const total = items.length;
  const totalMinutes = items.reduce(
    (sum, i) => sum + (i.durationMin || 0) * (i.watchCount || 1),
    0
  );
  const totalHours = Math.round(totalMinutes / 60);

  const byType = TYPES.map((ty) => ({
    type: ty,
    count: items.filter((i) => i.type === ty).length,
  }));
  const maxType = Math.max(1, ...byType.map((b) => b.count));

  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: items.filter((i) => i.rating === r).length,
  }));
  const maxRating = Math.max(1, ...ratingDist.map((b) => b.count));

  const topRated = [...items]
    .filter((i) => i.rating)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  const Bar = ({ value, max }: { value: number; max: number }) => (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-gradient mb-8 text-3xl font-extrabold tracking-tight">
        {t("stats.title")}
      </h1>

      {/* Suvestine */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="glass p-6">
          <p className="text-sm text-white/50">{t("stats.totalItems")}</p>
          <p className="mt-1 text-4xl font-bold">{total}</p>
        </div>
        <div className="glass p-6">
          <p className="text-sm text-white/50">{t("stats.totalHours")}</p>
          <p className="mt-1 text-4xl font-bold">{totalHours}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pagal kategorija */}
        <section className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            {t("stats.byType")}
          </h2>
          <div className="space-y-3">
            {byType.map((b) => (
              <div key={b.type} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-white/60">
                  {t(`type.${b.type}`)}
                </span>
                <Bar value={b.count} max={maxType} />
                <span className="w-6 shrink-0 text-right text-xs text-white/50">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Ivertinimu pasiskirstymas */}
        <section className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            {t("stats.ratingDist")}
          </h2>
          <div className="space-y-3">
            {ratingDist.map((b) => (
              <div key={b.rating} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-amber-300">
                  {"★".repeat(b.rating)}
                </span>
                <Bar value={b.count} max={maxRating} />
                <span className="w-6 shrink-0 text-right text-xs text-white/50">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Eksportas (tik adminui) */}
      {admin && (
        <section className="glass mt-6 flex flex-wrap items-center gap-3 p-6">
          <span className="text-sm font-semibold text-white/70">
            {t("actions.export")}:
          </span>
          <a
            href="/api/export?format=json"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            JSON
          </a>
          <a
            href="/api/export?format=csv"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            CSV
          </a>
        </section>
      )}

      {/* Geriausiai ivertinti */}
      {topRated.length > 0 && (
        <section className="glass mt-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            {t("stats.topRated")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {topRated.map((i) => (
              <Link
                key={i.id}
                href={`/media/${i.id}`}
                className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                {i.title}{" "}
                <span className="text-amber-300">★{i.rating}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
