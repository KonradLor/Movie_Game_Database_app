// Draugystes uzklausos. Draugyste abipuse: bet kuri Friendship eilute su
// status=ACCEPTED reiskia, kad requester ir addressee yra draugai (nesvarbu kryptis).

import { db } from "./db";

// Priimtu draugu vartotoju id sarasas (be dublikatu - jei del lenktyniu susikure
// abikrypciai rysiai (A->B ir B->A), draugas nepasikartoja).
export async function getFriendUserIds(userId: string): Promise<string[]> {
  const rows = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return [
    ...new Set(
      rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId))
    ),
  ];
}

// Ar a ir b yra draugai (ACCEPTED, bet kuria kryptimi).
export async function areFriends(a: string, b: string): Promise<boolean> {
  if (a === b) return false;
  const row = await db.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
    select: { id: true },
  });
  return Boolean(row);
}

// Draugu User irasai (naujausi virsuje) + friendshipId (kad butu galima pasalinti).
export async function getFriends(userId: string) {
  const rows = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: { requester: true, addressee: true },
    orderBy: { updatedAt: "desc" },
  });
  const mapped = rows.map((r) => {
    const friend = r.requesterId === userId ? r.addressee : r.requester;
    return { ...friend, friendshipId: r.id };
  });
  // dedup pagal draugo id (jei del lenktyniu susikure abikrypciai rysiai)
  const seen = new Set<string>();
  return mapped.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));
}

// Gautos (man skirtos) laukiancios uzklausos.
export async function getIncomingRequests(userId: string) {
  return db.friendship.findMany({
    where: { status: "PENDING", addresseeId: userId },
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });
}

// Mano issiustos laukiancios uzklausos.
export async function getOutgoingRequests(userId: string) {
  return db.friendship.findMany({
    where: { status: "PENDING", requesterId: userId },
    include: { addressee: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingIncomingCount(userId: string): Promise<number> {
  return db.friendship.count({ where: { status: "PENDING", addresseeId: userId } });
}

export async function getUnreadRecommendationCount(userId: string): Promise<number> {
  return db.recommendation.count({ where: { toId: userId, readAt: null } });
}

// ----------------------------------------------------------------------
// Sekimas (Follow) - kryptinis: userId seka kitus.
// ----------------------------------------------------------------------

// Kuriuos vartotojus userId seka.
export async function getFollowingIds(userId: string): Promise<string[]> {
  const rows = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

export async function isFollowing(userId: string, targetId: string): Promise<boolean> {
  const row = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    select: { id: true },
  });
  return Boolean(row);
}

// Sekamu draugu naujausia VIESA (PUBLIC) veikla: ka ziurejo/zaide (WATCHED) IR ka
// nori paziureti/pazaisti (WATCHLIST). Rikiuojama pagal activityAt (kad "pazymejo
// ziureta" irgi issoktu i virsu, ne tik naujai pridetas). Su savininko vardu.
export async function getFollowingFeed(userId: string, take = 20) {
  const ids = await getFollowingIds(userId);
  if (ids.length === 0) return [];
  return db.mediaItem.findMany({
    where: {
      userId: { in: ids },
      visibility: "PUBLIC",
      status: { in: ["WATCHED", "WATCHLIST"] },
    },
    orderBy: { activityAt: { sort: "desc", nulls: "last" } },
    take,
    include: { user: { select: { name: true, userNumber: true } } },
  });
}

// "Nauja veikla" badge skaicius: kiek sekamu draugu veiklos atsirado nuo paskutinio
// karto (since = User.followFeedSeenAt). null = niekada ziureta -> visa dabartine.
export async function getNewFollowingActivityCount(
  userId: string,
  since: Date | null
): Promise<number> {
  const ids = await getFollowingIds(userId);
  if (ids.length === 0) return 0;
  return db.mediaItem.count({
    where: {
      userId: { in: ids },
      visibility: "PUBLIC",
      status: { in: ["WATCHED", "WATCHLIST"] },
      ...(since ? { activityAt: { gt: since } } : {}),
    },
  });
}
