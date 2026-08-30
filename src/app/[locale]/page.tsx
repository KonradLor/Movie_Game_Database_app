import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import CategoryNav from "@/components/CategoryNav";
import SearchBar from "@/components/SearchBar";
import MediaCard from "@/components/MediaCard";
import OnThisDay from "@/components/OnThisDay";
import FollowingFeed from "@/components/FollowingFeed";
import NowPlaying from "@/components/NowPlaying";
import type { MediaType, Prisma } from "@prisma/client";

const VALID_CATS = ["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const { cat = "", q = "" } = await searchParams;

  // Daugiavartotojiskumas: kiekvienas mato TIK savo irasus
  const where: Prisma.MediaItemWhereInput = {
    status: "WATCHED",
    userId: user?.id ?? "__no_user__",
  };
  if (cat && VALID_CATS.includes(cat)) where.type = cat as MediaType;
  if (q.trim()) where.title = { contains: q.trim(), mode: "insensitive" };

  const items = await db.mediaItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Antrastes juosta */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("app.title")}
          </h1>
          <p className="mt-1 text-sm text-white/55">{t("app.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar initialQ={q} cat={cat} />
        </div>
      </header>

      {/* Tavo "dabar zaidziu/ziuriu" + sekamu draugu srautas + On this day
          (tik be filtro/paieskos) */}
      {!cat && !q && <NowPlaying userId={user?.id ?? null} />}
      {!cat && !q && <FollowingFeed userId={user?.id ?? null} />}
      {!cat && !q && <OnThisDay userId={user?.id ?? null} />}

      {/* Filtrai */}
      <div className="mb-8">
        <CategoryNav active={cat} q={q} />
      </div>

      {/* Tinklelis */}
      {items.length === 0 ? (
        <section className="glass flex min-h-[40vh] items-center justify-center p-10 text-center">
          <p className="text-white/45">
            {q ? t("form.noResults") : t("home.empty")}
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </main>
  );
}
