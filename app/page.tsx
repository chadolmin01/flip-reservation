import { unstable_cache } from "next/cache";
import { TimelineCalendar } from "@/components/timeline-calendar";
import { RoomCard } from "@/components/room-card";
import { ROOMS, type ReservationDTO } from "@/lib/rooms";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { colorForUser } from "@/lib/colors";

// 서버 캐시: 14일치 예약을 'reservations' 태그로 보관
// → POST/DELETE/PATCH 가 revalidateTag('reservations') 호출 시까지 DB 안 침
// → 60초 안전 revalidate (이벤트 없이도 1분 이상 묵으면 자동 갱신)
const getCached14DayReservations = unstable_cache(
  async (_dateKey: string) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    return prisma.reservation.findMany({
      where: {
        startAt: { gte: start, lt: end },
        status: { in: ["confirmed", "pending"] },
      },
      include: { user: { select: { name: true, employeeId: true } } },
      orderBy: { startAt: "asc" },
    });
  },
  ["reservations-14d"],
  { tags: ["reservations"], revalidate: 60 },
);

export default async function HomePage() {
  const user = await getCurrentUser();

  // 자정 넘어가면 캐시키도 바뀌게 오늘 날짜 포함
  const t = new Date();
  const dateKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;

  const rows = user ? await getCached14DayReservations(dateKey) : [];

  const initialReservations: ReservationDTO[] = rows.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    title: r.title,
    attendees: r.attendees,
    startAt: r.startAt.toISOString(),
    endAt: r.endAt.toISOString(),
    status: r.status as ReservationDTO["status"],
    userName: r.user.name,
    employeeId: r.user.employeeId,
    mine: user ? r.userId === user.id : false,
  }));

  const userColor = user ? colorForUser(user.employeeId).fill : null;

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <section className="mb-12">
        <div className="flex items-center justify-end gap-3 text-caption-sm mb-3">
          {userColor && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: userColor }} />
              <span className="text-muted">내 예약 색상</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-muted" />
            <span className="text-muted">대기</span>
          </span>
        </div>
        <TimelineCalendar initialReservations={initialReservations} />
        <p className="text-caption-sm text-muted mt-2">
          예약된 블록의 색은 신청자별로 다릅니다. 빈 칸을 누르면 바로 예약 폼으로 이동합니다.
        </p>
      </section>

      <section className="mb-section">
        <h2 className="text-display-md text-ink mb-4">예약 가능한 공간</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
          {ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>
    </div>
  );
}
