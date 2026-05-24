import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { cachePersonAction, importTmdbAction } from "@/lib/actions";
import type { CachedWork } from "@/lib/people-cache";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const admin = await isAdmin();

  const person = await db.person.findUnique({
    where: { id },
    include: {
      credits: {
        include: { media: true },
      },
    },
  });
  if (!person) notFound();

  // Kuriniai musu kolekcijoje (per kreditus)
  const inCollection = person.credits
    .filter((c) => c.media)
    .map((c) => ({ media: c.media, role: c.role, character: c.character }));
  const collectionTmdbIds = new Set(
    inCollection.map((x) => x.media.tmdbId).filter(Boolean)
  );

  const works = (person.cachedWorks as unknown as CachedWork[] | null) || [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-block text-sm text-white/60 hover:text-white">
        ← {t("actions.back")}
      </Link>

      {/* Asmens antraste */}
      <div className="glass mb-8 flex flex-col gap-6 p-6 sm:flex-row">
        <div className="mx-auto w-40 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:mx-0">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photoUrl} alt={person.name} className="w-full" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center text-xs text-white/30">
              {person.name}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{person.name}</h1>
          {person.bio && (
            <p className="mt-3 line-clamp-6 text-sm text-white/70">{person.bio}</p>
          )}
          {admin && person.tmdbId && (
            <form action={cachePersonAction} className="mt-4">
              <input type="hidden" name="id" value={person.id} />
              <button className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                {works.length > 0 ? t("actions.refresh") : "+ Daugiau informacijos"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Kolekcijoje */}
      {inCollection.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Tavo kolekcijoje</h2>
          <div className="flex flex-wrap gap-2">
            {inCollection.map((x) => (
              <Link
                key={x.media.id}
                href={`/media/${x.media.id}`}
                className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                {x.media.title}
                {x.character && <span className="text-white/40"> — {x.character}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filmografija (kesuota is TMDB) */}
      {works.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Filmografija ({works.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {works.map((w) => {
              const owned = w.tmdbId && collectionTmdbIds.has(w.tmdbId);
              return (
                <div key={`${w.tmdbType}-${w.tmdbId}`} className="glass overflow-hidden p-2.5">
                  <div className="mb-2 aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
                    {w.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.poster} alt={w.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-white/25">
                        {w.title}
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-1 px-1 text-xs font-medium text-white/90">{w.title}</p>
                  <p className="px-1 text-[11px] text-white/40">
                    {w.year || ""} {w.role && `· ${w.role}`}
                  </p>
                  {admin && !owned && (
                    <form action={importTmdbAction} className="mt-1.5 px-1">
                      <input type="hidden" name="tmdbId" value={w.tmdbId} />
                      <input type="hidden" name="tmdbType" value={w.tmdbType} />
                      <input
                        type="hidden"
                        name="type"
                        value={w.tmdbType === "movie" ? "MOVIE" : "SERIES"}
                      />
                      <button className="w-full rounded bg-white/10 py-1 text-[11px] hover:bg-white/20">
                        + {t("actions.add")}
                      </button>
                    </form>
                  )}
                  {owned && (
                    <p className="px-1 text-[11px] text-emerald-400">✓ kolekcijoje</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
