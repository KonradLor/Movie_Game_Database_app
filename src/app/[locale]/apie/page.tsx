import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Puslapis „Apie“: kas kuria, kaip tvarkomi duomenys, duomenų šaltiniai, kontaktai
// (FR-11, LD4 maketas E-5). Duomenų lentelė atitinka kodą: prisma/schema.prisma,
// src/lib/feedback.ts, src/lib/theme.ts, src/lib/secret-box.ts.

const CONTACT_EMAIL = "klorenz.dev@kondev.app";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: `${t("kicker")} · Medijų dienoraštis` };
}

const ROWS = ["Name", "Items", "Code", "Keys", "Feedback", "Cookies"] as const;

export default async function AboutPage() {
  const t = await getTranslations("about");
  const card = "glass mb-6 scroll-mt-24 p-6";
  const h2 = "text-xl font-bold";
  const toc = [
    ["kas", t("tocWho")],
    ["duomenys", t("tocData")],
    ["saltiniai", t("tocSources")],
    ["kontaktai", t("tocContact")],
  ] as const;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-[var(--color-accent)]">{t("kicker")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mt-3 max-w-3xl text-white/75">{t("lead")}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="glass h-fit p-2 text-sm lg:sticky lg:top-24" aria-label={t("kicker")}>
          {toc.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-2 text-white/75 transition hover:bg-white/10 hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <div>
          <section id="kas" className={card}>
            <h2 className={h2}>{t("whoTitle")}</h2>
            <p className="mt-2 text-white/75">{t("whoText")}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                [t("factSince"), t("factSinceValue")],
                [t("factPrice"), t("factPriceValue")],
                [t("factLangs"), "Lietuvių · English · Deutsch"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <dt className="text-xs text-white/60">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="duomenys" className={card}>
            <h2 className={h2}>{t("dataTitle")}</h2>
            <p className="mt-1 text-sm text-white/70">{t("dataIntro")}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/60">
                    <th className="pb-2 pr-4 font-semibold">{t("colWhat")}</th>
                    <th className="pb-2 pr-4 font-semibold">{t("colWhy")}</th>
                    <th className="pb-2 font-semibold">{t("colWho")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r} className="border-b border-white/5 align-top">
                      <td className="py-3 pr-4 font-medium">{t(`row${r}What`)}</td>
                      <td className="py-3 pr-4 text-white/75">{t(`row${r}Why`)}</td>
                      <td className="py-3 text-white/75">{t(`row${r}Who`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>✓ {t("noTracking")}</li>
              <li>✓ {t("posters")}</li>
              <li>✓ {t("deletion")}</li>
            </ul>
          </section>

          <section id="saltiniai" className={card}>
            <h2 className={h2}>{t("sourcesTitle")}</h2>
            <p className="mt-1 text-sm text-white/70">{t("sourcesIntro")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{t("tmdbTitle")}</p>
                <p className="mt-1 text-sm text-white/70">{t("tmdbText")}</p>
                <p className="mt-3 text-sm">{t("tmdbNotice")}</p>
                <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:brightness-125">
                  themoviedb.org ↗
                </a>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{t("igdbTitle")}</p>
                <p className="mt-1 text-sm text-white/70">{t("igdbText")}</p>
                <p className="mt-3 text-sm">{t("igdbNotice")}</p>
                <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:brightness-125">
                  igdb.com ↗
                </a>
              </div>
            </div>
          </section>

          <section id="kontaktai" className={card}>
            <h2 className={h2}>{t("contactTitle")}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-white/75">{t("contactText")}</p>
                <p className="mt-1 text-sm text-white/60">
                  {t("contactEmail")}:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-white/85 underline decoration-white/30 underline-offset-4 hover:text-white">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
              <Link
                href="/atsiliepimai"
                className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2 text-sm font-semibold text-[var(--color-on-accent)] transition hover:brightness-110"
              >
                {t("contactButton")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
