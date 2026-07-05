"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { getCurrentUser } from "./current-user";
import { areFriends } from "./friends";

async function ensureUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Reikia prisijungti");
  return user;
}

// useActionState busena (grazinam i formas su atsiliepimu vartotojui).
export interface SocialState {
  ok?: boolean;
  error?: string; // i18n raktas (be "social." prefikso), pvz. "notFound"
}

function fdInt(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const n = parseInt(v.trim(), 10);
  return Number.isNaN(n) ? null : n;
}
function fdStr(fd: FormData, key: string, max: number): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

// ----------------------------------------------------------------------
// Draugystes uzklausa pagal koda (#userNumber)
// ----------------------------------------------------------------------
export async function sendFriendRequestAction(
  _prev: SocialState,
  fd: FormData
): Promise<SocialState> {
  const user = await ensureUser();
  const num = fdInt(fd, "userNumber");
  if (num === null || num <= 0) return { error: "badCode" };
  if (num === user.userNumber) return { error: "self" };

  const target = await db.user.findUnique({ where: { userNumber: num } });
  if (!target) return { error: "notFound" };

  // Ar jau yra rysys (bet kuria kryptimi)?
  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: user.id },
      ],
    },
  });
  if (existing) {
    if (existing.status === "ACCEPTED") return { error: "already" };
    // Jei JIS jau atsiunte man uzklausa - iskart priimam (abipusis noras).
    if (existing.addresseeId === user.id) {
      await db.friendship.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
      revalidatePath("/", "layout");
      return { ok: true };
    }
    return { error: "pending" }; // as jau issiunciau, laukiu
  }

  try {
    await db.friendship.create({
      data: { requesterId: user.id, addresseeId: target.id, status: "PENDING" },
    });
  } catch (e) {
    // Lenktynes: jei tuo pat metu jau sukurta ta pati uzklausa (P2002) -
    // traktuojam kaip "jau issiusta", o ne krentam su neapdorota klaida.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "pending" };
    }
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// Priimti gauta uzklausa
export async function acceptFriendRequestAction(fd: FormData) {
  const user = await ensureUser();
  const id = fdStr(fd, "id", 40);
  if (!id) return;
  const fr = await db.friendship.findUnique({ where: { id } });
  if (!fr || fr.addresseeId !== user.id || fr.status !== "PENDING") return;
  await db.friendship.update({ where: { id }, data: { status: "ACCEPTED" } });
  revalidatePath("/", "layout");
}

// Atmesti gauta / atsaukti issiusta / pasalinti drauga (bet kuri rysio eilute,
// kurioje vartotojas dalyvauja).
export async function removeFriendshipAction(fd: FormData) {
  const user = await ensureUser();
  const id = fdStr(fd, "id", 40);
  if (!id) return;
  const fr = await db.friendship.findUnique({ where: { id } });
  if (!fr || (fr.requesterId !== user.id && fr.addresseeId !== user.id)) return;
  // Pasalinam VISUS rysius tarp sios poros (ir galimus abikrypcius dublikatus),
  // kad "pasalinti" tikrai nutrauktu draugyste net esant dviems eilutems.
  await db.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: fr.requesterId, addresseeId: fr.addresseeId },
        { requesterId: fr.addresseeId, addresseeId: fr.requesterId },
      ],
    },
  });
  // Nutraukus draugyste - panaikinam ir sekimo rysius abiem kryptim (sekti gali
  // tik draugai, tad nepaliekam "kabancio" sekimo, kuris rodytu 404 nuorodas).
  await db.follow.deleteMany({
    where: {
      OR: [
        { followerId: fr.requesterId, followingId: fr.addresseeId },
        { followerId: fr.addresseeId, followingId: fr.requesterId },
      ],
    },
  });
  revalidatePath("/", "layout");
}

// ----------------------------------------------------------------------
// Sekimas: perjungti (sekti / nebesekti) drauga
// ----------------------------------------------------------------------
export async function toggleFollowAction(fd: FormData) {
  const user = await ensureUser();
  const targetId = fdStr(fd, "targetId", 40);
  if (!targetId || targetId === user.id) return;
  // Sekti galima tik drauga
  if (!(await areFriends(user.id, targetId))) return;

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
  });
  if (existing) {
    try {
      await db.follow.delete({ where: { id: existing.id } });
    } catch (e) {
      // Lenktynes (dvigubas paspaudimas) - jau nebeseka (P2025), ignoruojam.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) {
        throw e;
      }
    }
  } else {
    try {
      await db.follow.create({ data: { followerId: user.id, followingId: targetId } });
    } catch (e) {
      // Lenktynes (dvigubas paspaudimas) - jau seka (P2002), ignoruojam.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
        throw e;
      }
    }
  }
  revalidatePath("/", "layout");
}

// ----------------------------------------------------------------------
// Rekomendacija draugui (is savo iraso) su zinute
// ----------------------------------------------------------------------
export async function sendRecommendationAction(
  _prev: SocialState,
  fd: FormData
): Promise<SocialState> {
  const user = await ensureUser();
  const mediaId = fdStr(fd, "mediaId", 40);
  const toId = fdStr(fd, "toId", 40);
  const message = fdStr(fd, "message", 500);
  if (!mediaId || !toId) return { error: "badRequest" };
  if (toId === user.id) return { error: "self" };

  // Irasas turi priklausyti SIUNTEJUI
  const media = await db.mediaItem.findFirst({
    where: { id: mediaId, userId: user.id },
  });
  if (!media) return { error: "notFound" };
  // Rekomenduoti galima tik VIESA irasa (nuoseklu su "draugai mato tik public")
  if (media.visibility !== "PUBLIC") return { error: "notPublic" };

  // Gavejas turi buti draugas
  if (!(await areFriends(user.id, toId))) return { error: "notFriend" };

  // Nedubliuojam: jei jau yra NEPERSKAITYTA ta pati rekomendacija - nekuriam naujos
  const dup = await db.recommendation.findFirst({
    where: { fromId: user.id, toId, mediaId: media.id, readAt: null },
  });
  if (dup) return { ok: true };

  await db.recommendation.create({
    data: {
      fromId: user.id,
      toId,
      mediaId: media.id,
      mediaTitle: media.title,
      mediaType: media.type,
      mediaPoster: media.posterUrl,
      message,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// Pasalinti gauta rekomendacija (tik gavejas)
export async function dismissRecommendationAction(fd: FormData) {
  const user = await ensureUser();
  const id = fdStr(fd, "id", 40);
  if (!id) return;
  const rec = await db.recommendation.findUnique({ where: { id } });
  if (!rec || rec.toId !== user.id) return;
  await db.recommendation.delete({ where: { id } });
  revalidatePath("/", "layout");
}
