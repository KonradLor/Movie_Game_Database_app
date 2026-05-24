import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";

// Prisijungimas per esama Authentik (auth.kondev.app) OIDC.
// Google login eina per Authentik. Admin = ADMIN_EMAIL (allowlist).
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Veikia uz Caddy reverse proxy (media.kondev.app)
  trustHost: true,
  providers: [
    Authentik({
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Pazymime admina pagal el. pasta
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
      }
      token.isAdmin =
        !!token.email &&
        token.email.toLowerCase() === (process.env.ADMIN_EMAIL || "").toLowerCase();
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});
