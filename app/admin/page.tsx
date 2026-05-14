import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { type ReservationDTO } from "@/lib/rooms";
import { AdminDashboard } from "@/components/admin-dashboard";

// 항상 신선한 데이터로 렌더 (unstable_cache 우회)
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const rows = await prisma.reservation.findMany({
    where: { startAt: { gte: start, lt: end } },
    include: { user: { select: { name: true, employeeId: true } } },
    orderBy: { startAt: "asc" },
  });

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
