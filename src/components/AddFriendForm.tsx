"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { sendFriendRequestAction, type SocialState } from "@/lib/social-actions";

// Draugo pridejimas pagal koda (#userNumber). Naudoja useActionState atsiliepimui.
export default function AddFriendForm() {
  const t = useTranslations("friends");
  const [state, action, pending] = useActionState<SocialState, FormData>(
    sendFriendRequestAction,
    {}
  );

  const inputCls =
    "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none";

  return (
    <form action={action} className="space-y-2">
      <div className="flex items-stretch gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 focus-within:border-[var(--color-accent)]">
          <span className="text-white/40">#</span>
          <input
            name="userNumber"
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="123"
            className="w-full bg-transparent py-2 text-sm text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={t("addByCode")}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {t("sendRequest")}
        </button>
      </div>
      {state.error && (
        <p className="text-xs text-red-300">{t(`err_${state.error}`)}</p>
      )}
      {state.ok && <p className="text-xs text-emerald-300">{t("requestSent")}</p>}
    </form>
  );
}
