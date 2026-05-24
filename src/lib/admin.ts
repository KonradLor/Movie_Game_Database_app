import { auth } from "@/auth";

// Ar dabartinis vartotojas yra adminas (prisijunges + ADMIN_EMAIL).
// DEV apejimas: lokaliam kurimui (kol Authentik login dar neprijungtas)
// nustacius DEV_ADMIN=true .env faile. Veikia TIK ne-produkcijoje.
export async function isAdmin(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_ADMIN === "true") {
    return true;
  }
  const session = await auth();
  return Boolean(session?.user?.isAdmin);
}
