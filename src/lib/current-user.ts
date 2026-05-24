import { auth } from "@/auth";
import { db } from "./db";

// Dabartinis prisijunges vartotojas (DB irasas). Pirma karta prisijungus -
// sukuriamas User irasas ir priskiriamas userNumber (eiles nr. - API gating'ui).
// Tapatybes raktas: el. pastas (Authentik sub_mode=email).

export interface CurrentUser {
  id: string;
  userNumber: number;
  isAdmin: boolean;
  email: string | null;
  name: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) return null;

  const key = email.toLowerCase();

  let user = await db.user.findUnique({ where: { sub: key } });
  if (!user) {
    // Naujas vartotojas - priskiriam seka nr. (kiek jau yra + 1)
    const count = await db.user.count();
    const isAdmin = key === (process.env.ADMIN_EMAIL || "").toLowerCase();
    user = await db.user.create({
      data: {
        sub: key,
        email,
        name: session?.user?.name ?? null,
        userNumber: count + 1,
        isAdmin,
      },
    });
  }

  return {
    id: user.id,
    userNumber: user.userNumber,
    isAdmin: user.isAdmin,
    email: user.email,
    name: user.name,
  };
}

// Patogus helperis: grazina userId arba neegzistuojanti raktą (kad uzklausa
// negrazintu nieko, kai vartotojas neprisijunges).
export async function currentUserIdOrNone(): Promise<string> {
  const u = await getCurrentUser();
  return u?.id ?? "__no_user__";
}
