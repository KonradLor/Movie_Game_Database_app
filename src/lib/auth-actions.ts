"use server";

import { signIn, signOut } from "@/auth";

// Iskelti kaip named server actions - kad butu galima naudoti kliento
// komponentuose (UserMenu logout, TopBar login) per <form action={...}>.
export async function signInAction() {
  await signIn("authentik", { redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
