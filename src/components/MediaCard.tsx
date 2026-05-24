import { getTranslations } from "next-intl/server";
import type { MediaItem } from "@prisma/client";
import { Link } from "@/i18n/navigation";

export default async function MediaCard({ item }: { item: MediaItem }) {
  const t = await getTranslations();

  return (
    <Link
      href={`/media/${item.id}`}
      className="card-glow glass group block overflow-hidden p-2.5"
    >
      {/* Plakatas */}
      <div className="relative mb-2.5 aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
        {item.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/25">
            {item.title}
          </div>
        )}

        {/* Privatumo zyma */}
        {item.visibility === "PRIVATE" && (
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-red-300 backdrop-blur">
            {t("visibility.PRIVATE")}
          </span>
        )}
        {/* Ivertinimas ant plakato */}
        {item.rating && (
          <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur">
            ★ {item.rating}
          </span>
        )}
      </div>

      {/* Pavadinimas */}
      <h3 className="line-clamp-1 px-1 text-sm font-medium text-white/90">
        {item.title}
      </h3>

      {/* Meta eilute: metai · tipas · trukme */}
      <div className="mt-1 flex flex-wrap items-center gap-1.5 px-1 pb-1 text-[11px] text-white/45">
        {item.year && <span>{item.year}</span>}
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/60">
          {t(`type.${item.type}`)}
        </span>
        {item.durationMin && (
          <span>
            {item.durationMin} {t("card.minutes")}
          </span>
        )}
      </div>
    </Link>
  );
}
