import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { isAdmin } from "@/lib/admin";
import TmdbSearch from "@/components/TmdbSearch";
import MediaForm from "@/components/MediaForm";

export default async function AddPage() {
  if (!(await isAdmin())) notFound();
  const t = await getTranslations();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("form.addTitle")}</h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← {t("actions.back")}
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-white/70">
          {t("form.searchTmdb")}
        </h2>
        <TmdbSearch />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-white/70">
          {t("form.orManual")}
        </h2>
        <MediaForm />
      </section>
    </main>
  );
}
