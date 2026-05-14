import { TimelineCalendar } from "@/components/timeline-calendar";
import { RoomCard } from "@/components/room-card";
import { ROOMS, type ReservationDTO } from "@/lib/rooms";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { colorForUser } from "@/lib/colors";

export default async function HomePage() {
  const user = await getCurrentUser();

  // 14일치 예약을 한 번에 서버에서 미리 조회 → 화살표 이동 시 fetch 없이 클라이언트 필터링만
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const rows = user
    ? await prisma.reservation.findMany({
        where: {
          startAt: { gte: start, lt: end },
          status: { in: ["confirmed", "pending"] },
        },
        include: { user: { select: { name: true, employeeId: true } } },
        orderBy: { startAt: "asc" },
      })
    : [];

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
