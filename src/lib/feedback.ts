// Vartotoju atsiliepimu sistema. Pagrindinė saugykla yra DB lentelė Feedback
// (būsenos Nauja / Perskaityta / Sutvarkyta, admin sąrašas). Čia - TXT atsarginė
// kopija atskirame aplanke (FEEDBACK_DIR), po vieną failą per mėnesį. Serveryje
// aplankas yra bind-mount (/var/server-data/media-feedback -> /data/feedback), tad
// įrašus galima perskaityti ir tiesiogiai serveryje, net jei DB nepasiekiama.

import { promises as fs } from "fs";
import path from "path";
import type { FeedbackStatus } from "@prisma/client";

export const FEEDBACK_TYPES = ["BUG", "IDEA", "FEATURE", "FEEDBACK", "OTHER"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
// Admin būsenos (DB enum FeedbackStatus). "use server" failas konstantų eksportuoti negali.
export const FEEDBACK_STATUSES = ["NEW", "READ", "DONE"] as const satisfies readonly FeedbackStatus[];

// Vieno mėnesio failo riba (apsauga nuo disko užpildymo per viešą endpointą).
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
// Zenklas, kad mėnesio failas pilnas (route grąžina 429/klaidą).
export const FEEDBACK_FULL = "FEEDBACK_FULL";

export function feedbackDir(): string {
  return process.env.FEEDBACK_DIR || path.join(process.cwd(), ".feedback");
}

// Vienos eilutės laukams: pašalinam naujas eilutes (kad neklastotų įrašo struktūros).
function oneLine(s: string | null | undefined): string {
  return (s ?? "").replace(/[\r\n]+/g, " ").trim();
}
// Žinutei: kiekvieną eilutę atitraukiam, kad įterptas "===" skirtukas ar suklastota
// antraštė (col 0) netaptų tikru įrašo riboženkliu admin peržiūroje.
function indentMessage(s: string): string {
  return s.replace(/\r\n/g, "\n").split("\n").map((l) => `  ${l}`).join("\n");
}

export interface FeedbackEntry {
  type: string;
  message: string;
  name?: string | null;
  email?: string | null;
  locale?: string | null;
  user?: string | null; // prisijungusio vartotojo tapatybe (jei yra)
  at: Date;
}

function twoDigit(n: number): string {
  return String(n).padStart(2, "0");
}

export async function appendFeedback(e: FeedbackEntry): Promise<void> {
  const dir = feedbackDir();
  await fs.mkdir(dir, { recursive: true });
  const ym = `${e.at.getUTCFullYear()}-${twoDigit(e.at.getUTCMonth() + 1)}`;
  const file = path.join(dir, `feedback-${ym}.txt`);
  const ts = e.at.toISOString().replace("T", " ").slice(0, 19);

  // Sanitizuojam vartotojo įvestį (vienos eilutės laukai + atitraukta žinutė).
  const type = oneLine(e.type);
  const name = oneLine(e.name);
  const email = oneLine(e.email);
  const locale = oneLine(e.locale) || "-";
  const user = oneLine(e.user);
  const fromName = [name, email ? `<${email}>` : null].filter(Boolean).join(" ").trim();
  const from = fromName || user || "anonimas";

  const block =
    `============================================================\n` +
    `[${ts} UTC] ${type}\n` +
    `Nuo: ${from}${user && fromName ? `  (paskyra: ${user})` : ""}\n` +
    `Kalba: ${locale}\n` +
    `------------------------------------------------------------\n` +
    `${indentMessage(e.message)}\n\n`;

  // Disko-užpildymo apsauga: jei mėnesio failas jau per didelis - atmetam.
  try {
    const st = await fs.stat(file);
    if (st.size + Buffer.byteLength(block, "utf-8") > MAX_FILE_BYTES) {
      throw new Error(FEEDBACK_FULL);
    }
  } catch (err) {
    if (err instanceof Error && err.message === FEEDBACK_FULL) throw err;
    // ENOENT (failo dar nėra) - viskas gerai, kuriam.
  }

  await fs.appendFile(file, block, "utf-8");
}
