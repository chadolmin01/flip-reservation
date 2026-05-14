import Link from "next/link";
import type { Room } from "@/lib/rooms";

export function ReservationCard({ room }: { room: Room }) {
  const needsApproval = room.requiresApproval;

  return (
    <div className="bg-canvas rounded-md border border-hairline shadow-card p-6">
      <div className="mb-5">
        <p className="text-display-md text-ink">예약하기</p>
        <p className="text-body-sm text-muted mt-1">
          이름과 사번만 입력하면 됩니다.
        </p>
      </div>

      <ul className="space-y-2 text-body-sm">
        <Row k="공간" v={room.name} />
        <Row k="위치" v={room.location} />
        <Row k="정원" v={`${room.capacity}명`} />
        <Row k="확정 방식" v={needsApproval ? "관리자 승인" : "즉시 확정"} />
      </ul>

      <div className="border-t border-hairline my-5" />

      <Link
        href={`/reserve?room=${room.id}`}
        className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-rausch hover:bg-rausch-active text-white text-button-md transition"
      >
        예약 폼으로 이동
      </Link>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="text-ink text-right">{v}</span>
    </li>
  );
}
