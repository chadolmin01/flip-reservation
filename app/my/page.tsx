import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { colorForUser } from "@/lib/colors";
import { type ReservationDTO } from "@/lib/rooms";
import { MyList } from "@/components/my-list";

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await prisma.reservation.findMany({
    where: { userId: user.id },
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
    userName: user.name,
    employeeId: user.employeeId,
    mine: true,
  }));

  const color = colorForUser(user.employeeId);

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white font-medium"
          style={{ background: color.fill }}
        >
          {user.name.slice(0, 1)}
        </span>
        <h1 className="text-display-xl text-ink">
          {user.name}
          <span className="text-muted font-normal ml-1.5">#{user.employeeId}</span>
        </h1>
      </div>

      <MyList user={user} initialReservations={initialReservations} />
    </div>
  );
}
