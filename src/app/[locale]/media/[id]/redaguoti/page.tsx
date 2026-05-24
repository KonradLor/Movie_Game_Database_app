import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import MediaForm from "@/components/MediaForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const { id } = await params;
  const t = await getTranslations();

  // Tik SAVO irasa galima redaguoti
  const item = await db.mediaItem.findFirst({
    where: { id, userId: user.id },
    include: { tags: { include: { tag: true } } },
  });
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("form.editTitle")}</h1>
        <Link href={`/media/${id}`} className="text-sm text-white/60 hover:text-white">
          ← {t("actions.back")}
        </Link>
      </div>
      <MediaForm item={item} />
    </main>
  );
}
