"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function SearchBar({
  initialQ,
  cat,
}: {
  initialQ?: string;
  cat?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [q, setQ] = useState(initialQ || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    if (q.trim()) params.set("q", q.trim());
    const s = params.toString();
    router.push(s ? `/?${s}` : "/");
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xs">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("actions.search") + "…"}
        className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 pr-9 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-accent)] focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t("actions.search")}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/40 hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </form>
  );
}
