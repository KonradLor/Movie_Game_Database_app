import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import MediaForm from "@/components/MediaForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) notFound();
  const { id } = await params;
  const t = await getTranslations();

  const item = await db.mediaItem.findUnique({
    where: { id },
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
