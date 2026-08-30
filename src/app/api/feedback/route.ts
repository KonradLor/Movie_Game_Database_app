import { NextRequest, NextResponse } from "next/server";
import { appendFeedback, FEEDBACK_TYPES, FEEDBACK_FULL } from "@/lib/feedback";
import { getCurrentUser } from "@/lib/current-user";

// Apsaugos atmintyje (endpointas viešas, be autentifikacijos):
//  1) globalus limitas - visiems kartu ne daugiau GLOBAL_MAX per langą;
//  2) vienas IP - ne dažniau nei kas COOLDOWN_MS (spoof-atsparus - žr. clientIp).
const lastByIp = new Map<string, number>();
const COOLDOWN_MS = 8000;
const GLOBAL_MAX = 30;
const GLOBAL_WINDOW_MS = 60_000;
let winStart = 0;
let winCount = 0;

function globalAllowed(now: number): boolean {
  if (now - winStart >= GLOBAL_WINDOW_MS) {
    winStart = now;
    winCount = 0;
  }
  if (winCount >= GLOBAL_MAX) return false;
  winCount++;
  return true;
}

// Klientą už Caddy proxy: Caddy PRIDEDA realų peer IP į X-Forwarded-For galą,
// tad imam PASKUTINĘ reikšmę (kliento suklastotos reikšmės lieka kairėje ir
// throttle'o neapeina). Be XFF - x-real-ip.
function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function clip(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

// POST /api/feedback  body: { type, message, name?, email?, locale? }
// Vieša (bet kas gali siųsti). Saugoma į TXT (FEEDBACK_DIR).
export async function POST(req: NextRequest) {
  const now = Date.now();
  // Globalus limitas pirmiausia (gina net jei per-IP kaip nors apeitas).
  if (!globalAllowed(now)) {
    return NextResponse.json({ error: "tooFast" }, { status: 429 });
  }
  const ip = clientIp(req);
  const last = lastByIp.get(ip) || 0;
  if (now - last < COOLDOWN_MS) {
    return NextResponse.json({ error: "tooFast" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }

  const message = clip(body.message, 5000);
  if (!message) {
    return NextResponse.json({ error: "emptyMessage" }, { status: 400 });
  }
  const rawType = clip(body.type, 20);
  const type = (FEEDBACK_TYPES as readonly string[]).includes(rawType ?? "")
    ? (rawType as string)
    : "OTHER";
  const name = clip(body.name, 100);
  const email = clip(body.email, 200);
  const locale = clip(body.locale, 8);

  // Prisijungusio vartotojo tapatybe (jei yra) - papildomas kontekstas.
  let user: string | null = null;
  try {
    const u = await getCurrentUser();
    user = u ? u.name || u.email || `#${u.userNumber}` : null;
  } catch {
    user = null;
  }

  try {
    await appendFeedback({ type, message, name, email, locale, user, at: new Date() });
  } catch (e) {
    if (e instanceof Error && e.message === FEEDBACK_FULL) {
      return NextResponse.json({ error: FEEDBACK_FULL }, { status: 429 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "writeFailed" },
      { status: 500 }
    );
  }

  lastByIp.set(ip, now);
  // Kartais isvalom sena throttle busena (kad Map neaugtu be galo).
  if (lastByIp.size > 5000) {
    for (const [k, ts] of lastByIp) if (now - ts > COOLDOWN_MS) lastByIp.delete(k);
  }

  return NextResponse.json({ ok: true });
}
