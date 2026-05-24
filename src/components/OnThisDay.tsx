import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import type { Prisma } from "@prisma/client";

export default async function OnThisDay({ admin }: { admin: boolean }) {
  const t = await getTranslations();
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();

  const where: Prisma.MediaItemWhereInput = {
    OR: [{ firstWatched: { not: null } }, { lastWatched: { not: null } }],
  };
  if (!admin) where.visibility = "PUBLIC";

  const candidates = await db.mediaItem.findMany({ where });

  const matches = candidates.filter((i) => {
    const dates = [i.firstWatched, i.lastWatched].filter(Boolean) as Date[];
    return dates.some(
      (x) =>
        x.getMonth() === m && x.getDate() === d && x.getFullYear() !== now.getFullYear()
    );
  });

  if (matches.length === 0) return null;

  return (
    <section className="glass mb-8 p-5">
      <h2 className="text-sm font-semibold text-white/80">{t("onThisDay.title")}</h2>
      <p className="mb-3 text-xs text-white/45">{t("onThisDay.subtitle")}</p>
      <div className="flex flex-wrap gap-2">
        {matches.map((i) => (
          <Link
            key={i.id}
            href={`/media/${i.id}`}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            {i.title} {i.year && <span className="text-white/40">({i.year})</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
