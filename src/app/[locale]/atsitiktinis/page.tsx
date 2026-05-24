import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import type { Prisma } from "@prisma/client";

export default async function RandomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const admin = await isAdmin();

  const where: Prisma.MediaItemWhereInput = {};
  if (!admin) where.visibility = "PUBLIC";

  const count = await db.mediaItem.count({ where });
  if (count > 0) {
    const skip = Math.floor(Math.random() * count);
    const [item] = await db.mediaItem.findMany({ where, skip, take: 1 });
    if (item) redirect({ href: `/media/${item.id}`, locale });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-white/50">{t("home.empty")}</p>
    </main>
  );
}
