import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getFollowingFeed } from "@/lib/friends";
import { pickText } from "@/lib/locale";
import { verbKey } from "@/components/FollowingFeed";

export default async function FollowingActivityPage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const t = await getTranslations("follow");
  const locale = await getLocale();

  const prevSeen = user.followFeedSeenAt;
  // seenAt fiksuojam PRIES skaityma: veikla, atsiradusi skaitymo metu, nebus
  // "prarasta" (kitas badge ja dar suskaiciuos, nes activityAt > seenAt).
  const seenAt = new Date();
  const items = await getFollowingFeed(user.id, 40);

  // Pazymim, kad srautas perziuretas (badge isvalomas kitam apsilankymui).
  // items jau atmintyje - "nauja" zymos rodomos pagal prevSeen dar sioje perziuroje.
  await db.user.update({
    where: { id: user.id },
    data: { followFeedSeenAt: seenAt },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gradient text-2xl font-bold">{t("feedTitle")}</h1>
        <Link href="/draugai" className="text-sm text-white/60 hover:text-white">
          ← {t("navLabel")}
        </Link>
      </div>

      {items.length === 0 ? (
        <section className="glass flex min-h-[30vh] items-center justify-center p-10 text-center">
          <p className="text-white/45">{t("empty")}</p>
        </section>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => {
            const { title } = pickText(i, locale);
            const isNew = prevSeen ? Boolean(i.activityAt && i.activityAt > prevSeen) : true;
            return (
              <li key={i.id} className="glass flex items-center gap-3 p-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">
                  {i.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.posterUrl} alt={title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{i.user.name || `#${i.user.userNumber}`}</span>{" "}
                    <span className="text-white/50">{t(verbKey(i.type, i.status))}</span>{" "}
                    <Link href={`/media/${i.id}`} className="text-[var(--color-accent)] hover:underline">
                      {title}
                    </Link>
                    {isNew && (
                      <span className="ml-2 rounded-full bg-[var(--color-accent)]/25 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                        {t("new")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {i.type === "GAME" ? "🎮" : "🎬"}{" "}
                    {(i.activityAt ?? i.createdAt).toISOString().slice(0, 10)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
