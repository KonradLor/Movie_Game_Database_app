import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { areFriends } from "@/lib/friends";
import MediaCard from "@/components/MediaCard";

export default async function FriendCollectionPage({
  params,
}: {
  params: Promise<{ nr: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const { nr } = await params;
  const num = parseInt(nr, 10);
  if (Number.isNaN(num)) notFound();

  const friend = await db.user.findUnique({ where: { userNumber: num } });
  if (!friend) notFound();
  if (friend.id === user.id) redirect("/"); // savo kolekcija - namie

  // Tik jei esate draugai (priimta)
  if (!(await areFriends(user.id, friend.id))) notFound();

  const t = await getTranslations();
  const name = friend.name || `#${friend.userNumber}`;

  // Tik VIESI (PUBLIC) perziureti/zaisti irasai
  const items = await db.mediaItem.findMany({
    where: { userId: friend.id, visibility: "PUBLIC", status: "WATCHED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-gradient text-2xl font-bold sm:text-3xl">
            {t("friendCol.title", { name })}
          </h1>
          <p className="mt-1 text-sm text-white/50">{t("friendCol.subtitle")}</p>
        </div>
        <Link href="/draugai" className="text-sm text-white/60 hover:text-white">
          ← {t("friends.title")}
        </Link>
      </div>

      {items.length === 0 ? (
        <section className="glass flex min-h-[30vh] items-center justify-center p-10 text-center">
          <p className="text-white/45">{t("friendCol.empty")}</p>
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
