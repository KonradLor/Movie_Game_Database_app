import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMyNowPlaying } from "@/lib/friends";
import { markWatchedAction } from "@/lib/actions";
import { pickText } from "@/lib/locale";

// Tavo paties "dabar zaidziu/ziuriu" (PLAYING) juosta pagrindiniame puslapyje.
// Kiekvienam - vieno paspaudimo "Baigiau" (-> i zaistus/ziuretus, markWatched).
export default async function NowPlaying({ userId }: { userId: string | null }) {
  if (!userId) return null;
  const items = await getMyNowPlaying(userId);
  if (items.length === 0) return null;

  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <section className="glass mb-8 p-5">
      <h2 className="mb-3 text-sm font-semibold text-white/80">{t("now.myHeading")}</h2>
      <ul className="space-y-2">
        {items.map((i) => {
          const { title } = pickText(i, locale);
          return (
            <li key={i.id} className="flex items-center gap-3">
              <span aria-hidden className="text-lg">
                {i.type === "GAME" ? "🎮" : "📺"}
              </span>
              <Link
                href={`/media/${i.id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-white/90 hover:text-white hover:underline"
              >
                {title}
              </Link>
              <form action={markWatchedAction} className="shrink-0">
                <input type="hidden" name="id" value={i.id} />
                <button className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/30">
                  ✓ {t("now.finish")}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
