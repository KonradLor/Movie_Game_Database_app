import { getTranslations } from "next-intl/server";

// Rodoma TIK mazame ekrane (<768px). Desktope paslepta (md:hidden).
// Mandagiai paaiskina, kad portalas skirtas kompiuteriui.
export default async function MobileGate() {
  const t = await getTranslations();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)] px-6 text-center md:hidden">
      <div className="glass max-w-sm p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)]">
          {/* Monitoriaus ikona */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <h1 className="text-gradient text-2xl font-bold">{t("mobile.title")}</h1>
        <p className="mt-3 text-sm text-white/70">{t("mobile.message")}</p>
        <p className="mt-2 text-xs text-white/45">{t("mobile.hint")}</p>
      </div>
    </div>
  );
}
