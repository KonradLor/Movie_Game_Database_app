import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Link } from "@/i18n/navigation";
import { pickText } from "@/lib/locale";
import { markWatchedAction } from "@/lib/actions";
import type { Prisma } from "@prisma/client";

export default async function WatchlistPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const user = await getCurrentUser();
  const loggedIn = !!user;

  const where: Prisma.MediaItemWhereInput = {
    status: "WATCHLIST",
    userId: user?.id ?? "__no_user__",
  };

  const items = await db.mediaItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-gradient mb-8 text-3xl font-extrabold tracking-tight">
        {t("watchlist.title")}
      </h1>

      {items.length === 0 ? (
        <section className="glass flex min-h-[40vh] items-center justify-center p-10 text-center">
          <p className="text-white/45">{t("watchlist.empty")}</p>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => {
            const { title } = pickText(item, locale);
            return (
            <div key={item.id} className="card-glow glass overflow-hidden p-2.5">
              <Link href={`/media/${item.id}`} className="group block">
                <div className="mb-2.5 aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                  {item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.posterUrl}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-white/25">
                      {title}
                    </div>
                  )}
                </div>
                <h3 className="line-clamp-1 px-1 text-sm font-medium text-white/90">
                  {title}
                </h3>
              </Link>
              {loggedIn && (
                <form action={markWatchedAction} className="mt-2 px-1">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="w-full rounded-lg bg-white/10 py-1.5 text-xs font-medium text-white transition hover:bg-white/20">
                    ✓ {t("watchlist.markWatched")}
                  </button>
                </form>
              )}
            </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
