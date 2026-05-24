import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkApiKey } from "@/lib/api-key";
import { updateMediaFromData } from "@/lib/media-service";

// PATCH /api/admin/media/[id] -> atnaujinti laukus
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const k = checkApiKey(req);
  if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status });

  const { id } = await params;
  const exists = await db.mediaItem.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Nerasta" }, { status: 404 });

  try {
    const body = await req.json();
    await updateMediaFromData(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Klaida" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const k = checkApiKey(req);
  if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status });

  const { id } = await params;
  const exists = await db.mediaItem.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Nerasta" }, { status: 404 });

  await db.mediaItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
