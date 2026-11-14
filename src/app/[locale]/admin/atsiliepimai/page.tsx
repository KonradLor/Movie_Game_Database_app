import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { FeedbackStatus, Prisma } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { FEEDBACK_TYPES, FEEDBACK_STATUSES } from "@/lib/feedback";
import { setFeedbackStatusAction } from "@/lib/feedback-actions";

// Admin atsiliepimų sąrašas: būsenos (Nauja / Perskaityta / Sutvarkyta) ir tipų
// filtras (FR-13, LD4 maketas E-8, sprendimas S12 - DB lentelė Feedback).
export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ tipas?: string; busena?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const t = await getTranslations("feedbackAdmin");
  const tf = await getTranslations("feedback");
  const { tipas, busena } = await searchParams;
  const type = (FEEDBACK_TYPES as readonly string[]).includes(tipas ?? "") ? tipas! : null;
  const status = (FEEDBACK_STATUSES as readonly string[]).includes(busena ?? "")
    ? (busena as FeedbackStatus)
    : null;

  // Skaičiai prie filtrų: būsenos skaičiuojamos pasirinktam tipui, tipai - pasirinktai būsenai.
  const [byStatus, byType, shown] = await Promise.all([
    db.feedback.groupBy({ by: ["status"], where: type ? { type } : {}, _count: true }),
    db.feedback.groupBy({ by: ["type"], where: status ? { status } : {}, _count: true }),
    db.feedback.findMany({
      where: { ...(type ? { type } : {}), ...(status ? { status } : {}) } satisfies Prisma.FeedbackWhereInput,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  const countStatus = (s: FeedbackStatus | null) =>
    byStatus.filter((r) => !s || r.status === s).reduce((n, r) => n + r._count, 0);
  const countType = (ty: string | null) =>
    byType.filter((r) => !ty || r.type === ty).reduce((n, r) => n + r._count, 0);
  const total = countStatus(null);

  const label = (ty: string) =>
    (FEEDBACK_TYPES as readonly string[]).includes(ty) ? tf(`type_${ty}`) : ty;
  const href = (p: { tipas?: string | null; busena?: string | null }) => {
    const q = new URLSearchParams();
    if (p.tipas) q.set("tipas", p.tipas);
    if (p.busena) q.set("busena", p.busena);
    const s = q.toString();
    return s ? `/admin/atsiliepimai?${s}` : "/admin/atsiliepimai";
  };
  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm transition ${
      on
        ? "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] font-semibold text-[var(--color-on-accent)]"
        : "border border-white/15 text-white/75 hover:border-white/40 hover:text-white"
    }`;
  const badge: Record<FeedbackStatus, string> = {
    NEW: "border-[var(--color-accent)] text-[var(--color-accent)]",
    READ: "border-white/25 text-white/75",
    DONE: "border-emerald-400/60 text-emerald-300",
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm text-white/70">
        <Link href="/admin" className="hover:text-white">{t("crumb")}</Link> › {t("title")}
      </p>
      <h1 className="text-gradient mt-1 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mb-6 mt-1 text-sm text-white/70">{t("intro")}</p>

      <div className="mb-3 flex flex-wrap gap-2" aria-label={t("statusFilter")}>
        <Link href={href({ tipas: type })} className={chip(!status)}>
          {t("allStatuses")} · {countStatus(null)}
        </Link>
        {FEEDBACK_STATUSES.map((s) => (
          <Link key={s} href={href({ tipas: type, busena: s })} className={chip(status === s)}>
            {t(`status_${s}`)} · {countStatus(s)}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2" aria-label={t("typeFilter")}>
        <Link href={href({ busena: status })} className={chip(!type)}>
          {t("allTypes")} · {countType(null)}
        </Link>
        {FEEDBACK_TYPES.map((ty) => (
          <Link key={ty} href={href({ tipas: ty, busena: status })} className={chip(type === ty)}>
            {label(ty)} · {countType(ty)}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="glass p-6 text-sm text-white/70">{total === 0 && !type ? t("empty") : t("emptyFilter")}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((f) => (
            <li key={f.id} className="glass p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
                <span className={`rounded-md border px-2 py-0.5 font-semibold ${badge[f.status]}`}>
                  {t(`status_${f.status}`)}
                </span>
                <span className="rounded-md border border-white/15 px-2 py-0.5 font-semibold text-white/85">{label(f.type)}</span>
                <span>
                  {[f.name, f.email ? `<${f.email}>` : null].filter(Boolean).join(" ") || f.account || t("anonymous")}
                </span>
                {f.account && (f.name || f.email) && <span>({t("account")}: {f.account})</span>}
                {f.locale && <span className="rounded border border-white/15 px-1.5 uppercase">{f.locale}</span>}
                <span className="ml-auto tabular-nums">
                  {f.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-white/90">{f.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {FEEDBACK_STATUSES.filter((s) => s !== f.status).map((s) => (
                  <form key={s} action={setFeedbackStatusAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:border-white/40 hover:text-white">
                      {t(`mark_${s}`)}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
