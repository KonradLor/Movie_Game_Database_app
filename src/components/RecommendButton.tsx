"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { sendRecommendationAction, type SocialState } from "@/lib/social-actions";

interface Friend {
  id: string;
  userNumber: number;
  name: string | null;
}

// Rekomendacijos siuntimas draugui is savo (vieso) iraso detaliu puslapio.
export default function RecommendButton({
  mediaId,
  friends,
}: {
  mediaId: string;
  friends: Friend[];
}) {
  const t = useTranslations("rec");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SocialState, FormData>(
    sendRecommendationAction,
    {}
  );

  if (friends.length === 0) return null;

  const inputCls =
    "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none";

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
      >
        ✉ {t("recommend")}
      </button>

      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <input type="hidden" name="mediaId" value={mediaId} />
          <div>
            <label className="mb-1 block text-xs text-white/60">{t("toFriend")}</label>
            <select name="toId" className={inputCls}>
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || `#${f.userNumber}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <textarea
              name="message"
              rows={2}
              placeholder={t("messagePlaceholder")}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {t("send")}
            </button>
            {state.ok && <span className="text-xs text-emerald-300">{t("sent")}</span>}
            {state.error && <span className="text-xs text-red-300">{t("error")}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
