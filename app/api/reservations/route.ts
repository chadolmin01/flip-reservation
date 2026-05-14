import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROOMS } from "@/lib/rooms";

const VALID_ROOMS = new Set(ROOMS.map((r) => r.id));

// GET /api/reservations?day=0  → 해당 일자(0=오늘)의 모든 예약
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dayParam = searchParams.get("day");
  const day = dayParam == null ? null : parseInt(dayParam, 10);
  const mineOnly = searchParams.get("mine") === "1";

  const dayFilter =
    day != null && Number.isFinite(day)
      ? (() => {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() + day);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          return { startAt: { gte: start, lt: end } };
        })()
      : {};

  const where = {
    ...dayFilter,
    ...(mineOnly ? { userId: me.id } : {}),
  };

  const reservations = await prisma.reservation.findMany({
    where,
    include: { user: { select: { name: true, employeeId: true } } },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({
    reservations: reservations.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      title: r.title,
      attendees: r.attendees,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      status: r.status,
      userName: r.user.name,
      employeeId: r.user.employeeId,
      mine: r.userId === me.id,
    })),
  });
}

// POST /api/reservations  { roomId, title, attendees, startAt, endAt }
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: {
    roomId?: string;
    title?: string;
    attendees?: number;
    startAt?: string;
    endAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const { roomId, title, attendees, startAt, endAt } = body;

  if (!roomId || !VALID_ROOMS.has(roomId)) {
    return NextResponse.json({ error: "유효하지 않은 회의실" }, { status: 400 });
  }
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "회의명을 입력하세요" }, { status: 400 });
  }
  if (!startAt || !endAt) {
    return NextResponse.json({ error: "시간이 누락되었습니다" }, { status: 400 });
  }
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "시간이 잘못되었습니다" }, { status: 400 });
  }
  if (start.getTime() < Date.now()) {
    return NextResponse.json({ error: "지난 시간으로는 예약할 수 없습니다" }, { status: 400 });
  }

  const room = ROOMS.find((r) => r.id === roomId)!;
  const att = Number(attendees ?? 1);
  if (!Number.isFinite(att) || att < 1 || att > room.capacity) {
    return NextResponse.json(
      { error: `참석 인원은 1–${room.capacity}명 사이여야 합니다` },
      { status: 400 },
    );
  }

  // 충돌 검증 (트랜잭션 안에서 다시 한 번 확인)
  const result = await prisma.$transaction(async (tx) => {
    const conflict = await tx.reservation.findFirst({
      where: {
        roomId,
        status: { in: ["confirmed", "pending"] },
        AND: [
          { startAt: { lt: end } },
          { endAt: { gt: start } },
        ],
      },
      select: { id: true },
    });
    if (conflict) {
      return { error: "다른 예약과 시간이 겹칩니다" as const };
    }
    const created = await tx.reservation.create({
      data: {
        roomId,
        userId: me.id,
        title: title.trim(),
        attendees: att,
        startAt: start,
        endAt: end,
        status: room.requiresApproval ? "pending" : "confirmed",
      },
    });
    return { reservation: created };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    reservation: {
      id: result.reservation.id,
      roomId: result.reservation.roomId,
      title: result.reservation.title,
      attendees: result.reservation.attendees,
      startAt: result.reservation.startAt.toISOString(),
      endAt: result.reservation.endAt.toISOString(),
      status: result.reservation.status,
    },
  });
}
