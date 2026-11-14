"use server";

import { revalidatePath } from "next/cache";
import type { FeedbackStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { FEEDBACK_STATUSES } from "@/lib/feedback";

// Atsiliepimo būsenos keitimas (tik administratorius). LD4 S12, maketas E-8.
export async function setFeedbackStatusAction(fd: FormData) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) throw new Error("Tik administratoriui");
  const id = fd.get("id");
  const status = fd.get("status");
  if (typeof id !== "string" || !id) throw new Error("Truksta id");
  if (!(FEEDBACK_STATUSES as readonly unknown[]).includes(status)) throw new Error("Bloga busena");
  await db.feedback.update({ where: { id }, data: { status: status as FeedbackStatus } });
  revalidatePath("/admin", "layout");
}
