import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { type ReservationDTO } from "@/lib/rooms";
import { AdminDashboard } from "@/components/admin-dashboard";

// 관리자용 14일치 예약 (모든 상태 포함). 같은 'reservations' 태그를 공유 →
// POST/DELETE/PATCH 가 revalidateTag('reservations') 호출하면 /와 /admin 캐시 동시 invalidate
const getCachedAllReservations = unstable_cache(
  async (_dateKey: string) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    return prisma.reservation.findMany({
      where: { startAt: { gte: start, lt: end } },
      include: { user: { select: { name: true, employeeId: true } } },
      orderBy: { startAt: "asc" },
    });
  },
  ["admin-reservations-14d"],
  { tags: ["reservations"], revalidate: 60 },
);

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const t = new Date();
  const dateKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const rows = await getCachedAllReservations(dateKey);

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
    mine: r.userId === me.id,
  }));

  return <AdminDashboard initialReservations={initialReservations} />;
}
