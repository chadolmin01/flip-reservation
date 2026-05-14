import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { id } = await params;
  const r = await prisma.reservation.findUnique({ where: { id } });
  if (!r) return NextResponse.json({ error: "예약을 찾을 수 없습니다" }, { status: 404 });
  if (r.userId !== me.id) {
    return NextResponse.json({ error: "본인 예약만 취소할 수 있습니다" }, { status: 403 });
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: "cancelled" },
  });

  revalidateTag("reservations");
  return NextResponse.json({ ok: true });
}

const VALID_STATUS = new Set([
  "confirmed",
  "pending",
  "rejected",
  "cancelled",
  "no_show",
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.status !== "string" || !VALID_STATUS.has(body.status)) {
    return NextResponse.json({ error: "잘못된 상태값" }, { status: 400 });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: body.status },
  });

  revalidateTag("reservations");
  return NextResponse.json({
    reservation: {
      id: updated.id,
      status: updated.status,
    },
  });
}
