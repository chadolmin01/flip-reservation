import { ReserveForm } from "@/components/reserve-form";
import { ROOMS, getRoom } from "@/lib/rooms";

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; start?: string; dayOffset?: string }>;
}) {
  const sp = await searchParams;
  const room = sp.room ? getRoom(sp.room) : ROOMS[0];
  if (!room) return null;

  return <ReserveForm room={room} startHour={sp.start} dayOffset={sp.dayOffset} />;
}
