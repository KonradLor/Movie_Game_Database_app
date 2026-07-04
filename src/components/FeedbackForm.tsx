"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

const TYPES = ["BUG", "IDEA", "FEATURE", "FEEDBACK", "OTHER"] as const;

export default function FeedbackForm() {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const [type, setType] = useState<string>("FEEDBACK");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "tooFast">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, name, email, locale }),
      });
      if (res.status === 429) {
        setStatus("tooFast");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none";
  const labelCls = "block text-sm text-white/70 mb-1";

  if (status === "sent") {
    return (
      <div className="glass p-6 text-center">
        <p className="text-lg font-medium text-emerald-300">✓ {t("sent")}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white transition hover:bg-white/20"
        >
          {t("sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("type")}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`type_${ty}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>
            {t("name")} <span className="text-white/30">({t("optional")})</span>
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>
          {t("email")} <span className="text-white/30">({t("optional")})</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>{t("message")}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          required
          maxLength={5000}
          placeholder={t("messagePlaceholder")}
          className={inputCls}
        />
      </div>

      {status === "error" && <p className="text-sm text-red-300">{t("error")}</p>}
      {status === "tooFast" && <p className="text-sm text-amber-300">{t("tooFast")}</p>}

      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "…" : t("submit")}
      </button>
    </form>
  );
}
