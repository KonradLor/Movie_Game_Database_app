import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFollowingFeed } from "@/lib/friends";
import { pickText } from "@/lib/locale";
import type { MediaType, MediaStatus } from "@prisma/client";

// Veiksmazodis pagal busena+tipa: zaidzia/ziuri dabar / ziurejo / zaide / nori.
export function verbKey(type: MediaType, status: MediaStatus): string {
  const isGame = type === "GAME";
  if (status === "PLAYING") return isGame ? "playingNow" : "watchingNow";
  if (status === "WATCHLIST") return isGame ? "wantsToPlay" : "wantsToWatch";
  return isGame ? "played" : "watched";
}

// Trumpas "informuotas" srautas: ka sekami draugai neseniai ziurejo/zaide ar nori.
// Rodomas pagrindinio puslapio virsuje (preview - pilnas srautas /sekimas).
export default async function FollowingFeed({ userId }: { userId: string | null }) {
  if (!userId) return null;
  const items = await getFollowingFeed(userId, 8);
  if (items.length === 0) return null;

  const t = await getTranslations("follow");
  const locale = await getLocale();

  return (
    <section className="glass mb-8 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">{t("feedHeading")}</h2>
        <Link href="/sekimas" className="text-xs text-[var(--color-accent)] hover:brightness-125">
          {t("seeAll")} →
        </Link>
      </div>
      <ul className="space-y-2">
        {items.map((i) => {
          const { title } = pickText(i, locale);
          return (
            <li key={i.id} className="flex items-center gap-2 text-sm">
              <span aria-hidden>{i.type === "GAME" ? "🎮" : "🎬"}</span>
              <span className="min-w-0 truncate text-white/80">
                <span className="font-medium">{i.user.name || `#${i.user.userNumber}`}</span>{" "}
                <span className="text-white/50">{t(verbKey(i.type, i.status))}</span>{" "}
                <Link href={`/media/${i.id}`} className="text-[var(--color-accent)] hover:underline">
                  {title}
                </Link>
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-white/30">
                {(i.activityAt ?? i.createdAt).toISOString().slice(0, 10)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
