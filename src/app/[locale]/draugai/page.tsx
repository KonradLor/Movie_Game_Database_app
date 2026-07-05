import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import {
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getFollowingIds,
} from "@/lib/friends";
import {
  acceptFriendRequestAction,
  removeFriendshipAction,
  toggleFollowAction,
} from "@/lib/social-actions";
import AddFriendForm from "@/components/AddFriendForm";
import MediaCard from "@/components/MediaCard";

function label(u: { name: string | null; userNumber: number }): string {
  return u.name || `#${u.userNumber}`;
}

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const t = await getTranslations("friends");
  const tFollow = await getTranslations("follow");

  const [friends, incoming, outgoing, followingIds] = await Promise.all([
    getFriends(user.id),
    getIncomingRequests(user.id),
    getOutgoingRequests(user.id),
    getFollowingIds(user.id),
  ]);
  const followingSet = new Set(followingIds);

  // Naujausia draugu veikla - ju viesi (PUBLIC) perziureti/zaisti irasai
  const friendIds = friends.map((f) => f.id);
  const activity = friendIds.length
    ? await db.mediaItem.findMany({
        where: { userId: { in: friendIds }, visibility: "PUBLIC", status: "WATCHED" },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];
  const nameById = new Map(friends.map((f) => [f.id, label(f)]));

  const btnGhost =
    "rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20";
  const btnDanger =
    "rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/25";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gradient text-2xl font-bold">{t("title")}</h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← {t("back")}
        </Link>
      </div>

      {/* Tavo kodas + pridejimas */}
      <section className="glass mb-6 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/50">{t("yourCode")}:</span>
          <span className="rounded-full bg-[var(--color-accent)]/20 px-3 py-1 font-mono font-semibold text-[var(--color-accent)]">
            #{user.userNumber}
          </span>
          <span className="text-xs text-white/40">{t("yourCodeHint")}</span>
        </div>
        <h2 className="mb-1 text-sm font-semibold text-white/80">{t("addByCode")}</h2>
        <p className="mb-3 text-xs text-white/45">{t("addHint")}</p>
        <AddFriendForm />
      </section>

      {/* Gautos uzklausos */}
      {incoming.length > 0 && (
        <section className="glass mb-6 p-6">
          <h2 className="mb-3 text-sm font-semibold text-white/80">{t("incoming")}</h2>
          <ul className="space-y-2">
            {incoming.map((fr) => (
              <li
                key={fr.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2"
              >
                <span className="text-sm">{label(fr.requester)}</span>
                <div className="flex items-center gap-2">
                  <form action={acceptFriendRequestAction}>
                    <input type="hidden" name="id" value={fr.id} />
                    <button className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/30">
                      ✓ {t("accept")}
                    </button>
                  </form>
                  <form action={removeFriendshipAction}>
                    <input type="hidden" name="id" value={fr.id} />
                    <button className={btnDanger}>{t("decline")}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Draugu sarasas */}
      <section className="glass mb-6 p-6">
        <h2 className="mb-3 text-sm font-semibold text-white/80">{t("yourFriends")}</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-white/45">{t("noFriends")}</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2"
              >
                <span className="text-sm">
                  {label(f)} <span className="text-white/35">#{f.userNumber}</span>
                </span>
                <div className="flex items-center gap-2">
                  <form action={toggleFollowAction}>
                    <input type="hidden" name="targetId" value={f.id} />
                    <button
                      className={
                        followingSet.has(f.id)
                          ? "rounded-lg bg-[var(--color-accent)]/20 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/30"
                          : btnGhost
                      }
                    >
                      {followingSet.has(f.id) ? `✓ ${tFollow("following")}` : tFollow("follow")}
                    </button>
                  </form>
                  <Link href={`/draugai/${f.userNumber}`} className={btnGhost}>
                    {t("viewCollection")}
                  </Link>
                  <form action={removeFriendshipAction}>
                    <input type="hidden" name="id" value={f.friendshipId} />
                    <button className={btnDanger}>{t("remove")}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Issiustos (laukiancios) uzklausos */}
      {outgoing.length > 0 && (
        <section className="glass mb-6 p-6">
          <h2 className="mb-3 text-sm font-semibold text-white/80">{t("outgoing")}</h2>
          <ul className="space-y-2">
            {outgoing.map((fr) => (
              <li
                key={fr.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2"
              >
                <span className="text-sm text-white/70">
                  {label(fr.addressee)}{" "}
                  <span className="text-xs text-white/35">({t("waiting")})</span>
                </span>
                <form action={removeFriendshipAction}>
                  <input type="hidden" name="id" value={fr.id} />
                  <button className={btnGhost}>{t("cancel")}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Naujausia draugu veikla */}
      <section className="glass p-6">
        <h2 className="mb-4 text-sm font-semibold text-white/80">{t("activity")}</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-white/45">{t("noActivity")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {activity.map((item) => (
              <div key={item.id}>
                <MediaCard item={item} />
                <p className="mt-1 truncate px-1 text-[11px] text-white/40">
                  {nameById.get(item.userId)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
