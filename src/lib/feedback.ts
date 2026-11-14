// Vartotoju atsiliepimu sistema. Viskas saugoma paprastu TXT formatu atskirame
// aplanke (FEEDBACK_DIR), po vieną failą per mėnesį. Serveryje aplankas yra
// bind-mount (/var/server-data/media-feedback -> /data/feedback), tad prieinamas
// tiek per portalą (admin), tiek tiesiogiai serveryje.

import { promises as fs } from "fs";
import path from "path";

export const FEEDBACK_TYPES = ["BUG", "IDEA", "FEATURE", "FEEDBACK", "OTHER"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

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

// Perskaityti visus atsiliepimus (admin peržiūrai portale). Naujausias mėnuo viršuje.
export async function readAllFeedback(): Promise<string> {
  const dir = feedbackDir();
  let files: string[];
  try {
    files = (await fs.readdir(dir))
      .filter((f) => f.startsWith("feedback-") && f.endsWith(".txt"))
      .sort()
      .reverse();
  } catch {
    return "";
  }
  const parts: string[] = [];
  for (const f of files) {
    const content = await fs.readFile(path.join(dir, f), "utf-8");
    parts.push(`### ${f}\n${content}`);
  }
  return parts.join("\n").trim();
}

// Išskaidytas atsiliepimas admin sąrašui (LD4 maketas E-8).
export interface ParsedFeedback {
  at: string; // "YYYY-MM-DD HH:MM:SS" (UTC)
  type: string;
  from: string;
  account: string | null;
  locale: string;
  message: string;
}

const DASH = "-".repeat(60);

// TXT formatą (žr. appendFeedback) paverčia įrašų sąrašu, naujausi pirmi.
// Žinutės eilutės atitrauktos 2 tarpais, todėl skaidom TIK ties eilutės pradžioje
// esančiu "=" x 60: įterptas (atitrauktas) skirtukas lieka žinutės tekstu.
export function parseFeedback(text: string): ParsedFeedback[] {
  const out: ParsedFeedback[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split(/^={60}\n/m)) {
    const lines = raw.split("\n");
    const head = /^\[(.+?) UTC\] (\S+)$/.exec(lines[0] ?? "");
    if (!head) continue;
    const nuo = /^Nuo: (.*?)(?:  \(paskyra: (.*)\))?$/.exec(lines[1] ?? "");
    const kalba = /^Kalba: (.*)$/.exec(lines[2] ?? "");
    if (lines[3] !== DASH) continue;
    const body: string[] = [];
    for (const l of lines.slice(4)) {
      if (l.startsWith("### feedback-")) break; // kito mėnesio failo antraštė
      body.push(l.startsWith("  ") ? l.slice(2) : l);
    }
    out.push({
      at: head[1],
      type: head[2],
      from: nuo?.[1] ?? "",
      account: nuo?.[2] ?? null,
      locale: kalba?.[1] ?? "-",
      message: body.join("\n").trim(),
    });
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
