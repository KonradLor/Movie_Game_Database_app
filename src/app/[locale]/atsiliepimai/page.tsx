import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import FeedbackForm from "@/components/FeedbackForm";

export default async function FeedbackPage() {
  const t = await getTranslations("feedback");
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin === true;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gradient text-2xl font-bold">{t("title")}</h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← {t("back")}
        </Link>
      </div>

      <p className="mb-6 text-sm text-white/55">{t("intro")}</p>

      <FeedbackForm />

      {/* Gauti atsiliepimai perkelti į /admin/atsiliepimai (LD4 E-8) */}
      {isAdmin && (
        <p className="mt-8 text-sm">
          <Link href="/admin/atsiliepimai" className="text-[var(--color-accent)] hover:brightness-125">
            {t("adminHeading")} →
          </Link>
        </p>
      )}
    </main>
  );
}
