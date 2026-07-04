import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { pickText } from "@/lib/locale";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();
  const user = await getCurrentUser();

  // Kreditai filtruojami i DABARTINIO vartotojo irasus (Company - bendras cache)
  const company = await db.company.findUnique({
    where: { id },
    include: {
      credits: {
        where: { media: { userId: user?.id ?? "__no_user__" } },
        include: { media: true },
      },
    },
  });
  if (!company) notFound();

  // Kuriniai tavo kolekcijoje
  const works = company.credits.map((c) => c.media).filter(Boolean);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-block text-sm text-white/60 hover:text-white">
        ← {t("actions.back")}
      </Link>

      <div className="glass mb-8 flex items-center gap-4 p-6">
        {company.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="h-12 w-auto" />
        )}
        <h1 className="text-2xl font-bold">{company.name}</h1>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-white/70">{t("detail.inCollection")}</h2>
      <div className="flex flex-wrap gap-2">
        {works.map((m) => (
          <Link
            key={m!.id}
            href={`/media/${m!.id}`}
            className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            {pickText(m!, locale).title}{" "}
            {m!.year && <span className="text-white/40">({m!.year})</span>}
          </Link>
        ))}
      </div>
    </main>
  );
}
