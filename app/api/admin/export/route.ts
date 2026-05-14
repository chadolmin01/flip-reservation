import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getRoom } from "@/lib/rooms";
import { generateUsageLogXls } from "@/lib/export";

// GET /api/admin/export?month=YYYY-MM&room=meeting → 월별 사용일지 .xls
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const roomId = searchParams.get("room");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month=YYYY-MM 형식" }, { status: 400 });
  }
  if (!roomId) {
    return NextResponse.json({ error: "room 파라미터가 필요합니다" }, { status: 400 });
  }
  const room = getRoom(roomId);
  if (!room) return NextResponse.json({ error: "회의실 없음" }, { status: 404 });

  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const rows = await prisma.reservation.findMany({
    where: {
      roomId,
      startAt: { gte: start, lt: end },
      status: { in: ["confirmed", "pending"] },
    },
    include: { user: { select: { name: true } } },
    orderBy: { startAt: "asc" },
  });

  const buf = generateUsageLogXls({
    month: m,
    room,
    rows: rows.map((r) => ({
      startAt: r.startAt,
      endAt: r.endAt,
      title: r.title,
      userName: r.user.name,
    })),
  });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="usage-${roomId}-${month}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
