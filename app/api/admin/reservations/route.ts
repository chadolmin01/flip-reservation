import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/admin/reservations?month=YYYY-MM&room=meeting
//  → 해당 월 + 해당 회의실의 모든 예약 (모든 상태 포함, 취소까지)
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const roomId = searchParams.get("room");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month=YYYY-MM 형식" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const rows = await prisma.reservation.findMany({
    where: {
      startAt: { gte: start, lt: end },
      ...(roomId ? { roomId } : {}),
    },
    include: { user: { select: { name: true, employeeId: true } } },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({
    reservations: rows.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      title: r.title,
      attendees: r.attendees,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      status: r.status,
      userName: r.user.name,
      employeeId: r.user.employeeId,
    })),
  });
}
