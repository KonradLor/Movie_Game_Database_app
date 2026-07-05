import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFollowingFeed } from "@/lib/friends";
import { pickText } from "@/lib/locale";

// Trumpas "informuotas" srautas: ka sekami draugai neseniai ziurejo/zaide.
// Rodomas pagrindinio puslapio virsuje. Grazina null, jei niekas nesekamas / nera veiklos.
export default async function FollowingFeed({ userId }: { userId: string | null }) {
  if (!userId) return null;
  const items = await getFollowingFeed(userId, 15);
  if (items.length === 0) return null;

  const t = await getTranslations("follow");
  const locale = await getLocale();

  return (
    <section className="glass mb-8 p-5">
      <h2 className="mb-3 text-sm font-semibold text-white/80">{t("feedHeading")}</h2>
      <ul className="space-y-2">
        {items.map((i) => {
          const isGame = i.type === "GAME";
          const name = i.user.name || `#${i.user.userNumber}`;
          const { title } = pickText(i, locale);
          return (
            <li key={i.id} className="flex items-center gap-2 text-sm">
              <span aria-hidden>{isGame ? "🎮" : "🎬"}</span>
              <span className="min-w-0 truncate text-white/80">
                <span className="font-medium">{name}</span>{" "}
                <span className="text-white/50">
                  {isGame ? t("played") : t("watched")}
                </span>{" "}
                <Link
                  href={`/media/${i.id}`}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {title}
                </Link>
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-white/30">
                {i.createdAt.toISOString().slice(0, 10)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
