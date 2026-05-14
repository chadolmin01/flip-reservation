import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  MAX_HOURS_PER_RESERVATION,
  MAX_HOURS_PER_WEEK,
  getWeekRange,
  hoursBetween,
} from "@/lib/limits";

// GET /api/quota?day=N  → 해당 일자가 속한 주의 본인 사용량 + 한도
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dayParam = searchParams.get("day");
  const dayOffset = dayParam == null ? 0 : parseInt(dayParam, 10) || 0;

  const ref = new Date();
  ref.setHours(0, 0, 0, 0);
  ref.setDate(ref.getDate() + dayOffset);

  const { start, end } = getWeekRange(ref);

  const items = await prisma.reservation.findMany({
    where: {
      userId: me.id,
      status: { in: ["confirmed", "pending"] },
      startAt: { gte: start, lt: end },
    },
    select: { startAt: true, endAt: true },
  });

  const usedHours = items.reduce(
    (sum, r) => sum + hoursBetween(r.startAt, r.endAt),
    0,
  );

  return NextResponse.json({
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    usedHours,
    weeklyLimit: MAX_HOURS_PER_WEEK,
    perReservationLimit: MAX_HOURS_PER_RESERVATION,
  });
}
