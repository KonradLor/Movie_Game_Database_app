import { NextRequest } from "next/server";

// PASIRENKAMA (opt-in) admin API apsauga raktu.
// Jei ADMIN_API_KEY .env faile NEnustatytas -> API ISJUNGTAS (grazina 404).
// Norint ijungti: .env faile nustatyti ADMIN_API_KEY=<ilgas atsitiktinis raktas>.

export interface ApiKeyResult {
  ok: boolean;
  status: number;
  error?: string;
}

export function isAdminApiEnabled(): boolean {
  return Boolean(process.env.ADMIN_API_KEY);
}

export function checkApiKey(req: NextRequest): ApiKeyResult {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    // Isjungta - elgiames lyg marsruto nebutu
    return { ok: false, status: 404, error: "Admin API išjungtas" };
  }
  const provided =
    req.headers.get("x-api-key") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (provided !== key) {
    return { ok: false, status: 401, error: "Neteisingas API raktas" };
  }
  return { ok: true, status: 200 };
}
