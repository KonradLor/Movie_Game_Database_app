// Vartotoju API raktu sifravimas DB (AES-256-GCM).
// Formatas: "enc:v1:<iv>:<tag>:<duomenys>" (base64url). Senos (nesifruotos)
// reiksmes atpazistamos pagal prefikso nebuvima ir grazinamos kaip yra -
// getCurrentUser jas persifruoja (tingi migracija, be atskiro skripto).
//
// Raktas: API_KEYS_SECRET (jei nustatytas), kitaip isvedamas is AUTH_SECRET per
// HKDF su atskira etikete (tas pats paslapties saltinis, kitas raktas).
// Pasikeitus paslapciai senu reiksmiu issifruoti nebus imanoma -> decrypt grazina
// null ir vartotojas raktus ives is naujo (geriau nei rodyti siuksles).

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const own = process.env.API_KEYS_SECRET;
  const base = own || process.env.AUTH_SECRET;
  if (!base) {
    throw new Error("API_KEYS_SECRET arba AUTH_SECRET nenustatytas - API raktu sifruoti negalima");
  }
  return Buffer.from(hkdfSync("sha256", base, "media-databank", "user-api-keys-v1", 32));
}

export function isEncrypted(v: string | null | undefined): boolean {
  return typeof v === "string" && v.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return PREFIX + [iv, tag, data].map((b) => b.toString("base64url")).join(":");
}

export function decryptSecret(v: string | null): string | null {
  if (v == null || v === "") return null;
  if (!isEncrypted(v)) return v; // sena nesifruota reiksme
  try {
    const [iv, tag, data] = v.slice(PREFIX.length).split(":").map((s) => Buffer.from(s, "base64url"));
    // Pilna 16 baitų žyma privaloma: be authTagLength Node priimtų ir sutrumpintą.
    if (iv?.length !== 12 || tag?.length !== 16 || !data) throw new Error("bad format");
    const d = createDecipheriv("aes-256-gcm", key(), iv, { authTagLength: 16 });
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    console.warn("[secret-box] nepavyko issifruoti API rakto (pasikeite paslaptis?)");
    return null;
  }
}
