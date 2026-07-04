import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { readAllFeedback } from "@/lib/feedback";
import FeedbackForm from "@/components/FeedbackForm";

export default async function FeedbackPage() {
  const t = await getTranslations("feedback");
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin === true;
  const collected = isAdmin ? await readAllFeedback() : "";

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

      {isAdmin && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-white/70">{t("adminHeading")}</h2>
          {collected ? (
            <pre className="glass max-h-[60vh] overflow-auto whitespace-pre-wrap break-words p-4 text-xs text-white/70">
              {collected}
            </pre>
          ) : (
            <p className="glass p-4 text-sm text-white/45">{t("empty")}</p>
          )}
        </section>
      )}
    </main>
  );
}
