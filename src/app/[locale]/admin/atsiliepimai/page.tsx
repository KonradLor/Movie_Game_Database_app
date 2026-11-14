import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { readAllFeedback, parseFeedback, FEEDBACK_TYPES } from "@/lib/feedback";

// Admin atsiliepimų sąrašas su tipų filtru (FR-13, LD4 maketas E-8).
// Būsenos (Nauja / Perskaityta / Sutvarkyta) - vėliau, su DB lentele (sprendimas S12).
export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ tipas?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const t = await getTranslations("feedbackAdmin");
  const tf = await getTranslations("feedback");
  const { tipas } = await searchParams;
  const active = (FEEDBACK_TYPES as readonly string[]).includes(tipas ?? "") ? tipas! : null;

  const all = parseFeedback(await readAllFeedback());
  const shown = active ? all.filter((f) => f.type === active) : all;
  const label = (type: string) =>
    (FEEDBACK_TYPES as readonly string[]).includes(type) ? tf(`type_${type}`) : type;

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm transition ${
      on
        ? "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] font-semibold text-white"
        : "border border-white/15 text-white/75 hover:border-white/40 hover:text-white"
    }`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm text-white/70">
        <Link href="/admin" className="hover:text-white">{t("crumb")}</Link> › {t("title")}
      </p>
      <h1 className="text-gradient mt-1 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mb-6 mt-1 text-sm text-white/70">{t("intro")}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/atsiliepimai" className={chip(!active)}>
          {t("allTypes")} · {all.length}
        </Link>
        {FEEDBACK_TYPES.map((type) => (
          <Link key={type} href={`/admin/atsiliepimai?tipas=${type}`} className={chip(active === type)}>
            {label(type)} · {all.filter((f) => f.type === type).length}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="glass p-6 text-sm text-white/70">{all.length === 0 ? t("empty") : t("emptyType")}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((f, i) => (
            <li key={`${f.at}-${i}`} className="glass p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/65">
                <span className="rounded-md border border-white/15 px-2 py-0.5 font-semibold text-white/85">{label(f.type)}</span>
                <span>{f.from && f.from !== "anonimas" ? f.from : t("anonymous")}</span>
                {f.account && <span>({t("account")}: {f.account})</span>}
                <span className="rounded border border-white/15 px-1.5 uppercase">{f.locale}</span>
                <span className="ml-auto tabular-nums">{f.at} UTC</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-white/90">{f.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
