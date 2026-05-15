"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { getRoom, type ReservationDTO } from "@/lib/rooms";
import { cn, formatDateKo, formatTime } from "@/lib/utils";
import { colorForUser } from "@/lib/colors";

type User = { id: string; name: string; employeeId: string };

export function MyList({
  user,
  initialReservations,
}: {
  user: User;
  initialReservations: ReservationDTO[];
}) {
  const color = colorForUser(user.employeeId);
  const router = useRouter();
  const [reservations, setReservations] = useState(initialReservations);

  const cancel = useCallback(
    async (id: string) => {
      if (!confirm("이 예약을 취소할까요?")) return;
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReservations((curr) =>
          curr.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
        );
        router.refresh(); // 홈 캐시도 같이 무효화 → 다음 / 방문 시 신선한 데이터
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "취소에 실패했습니다");
      }
    },
    [router],
  );

  if (reservations.length === 0) {
    return (
      <div className="text-center py-20 border border-hairline rounded-md">
        <p className="text-display-sm text-ink">아직 예약이 없습니다</p>
        <p className="text-body-md text-muted mt-1">
          메인 캘린더에서 비어있는 시간을 눌러 예약을 시작하세요.
        </p>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center px-6 mt-4 rounded-sm bg-rausch text-white text-button-md"
        >
          예약하러 가기
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline-soft">
      {reservations.map((r) => {
        const room = getRoom(r.roomId);
        if (!room) return null;
        const start = new Date(r.startAt);
        const end = new Date(r.endAt);
        const isCancelled = r.status === "cancelled";
        return (
          <li key={r.id} className="py-5 flex items-start gap-3 sm:gap-5">
            <div
              className={cn(
                "relative w-16 h-16 sm:w-24 sm:h-24 rounded-md shrink-0 overflow-hidden bg-surface-soft",
                isCancelled && "opacity-40",
              )}
            >
              <Image
                src={room.photoUrl}
                alt={room.name}
                fill
                sizes="(max-width: 640px) 64px, 96px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
              <span className="hidden sm:block absolute bottom-2 left-2 text-white text-caption font-medium drop-shadow">
                {room.name}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-uppercase-tag uppercase text-muted">
                    {formatDateKo(start)}
                  </p>
                  <h3
                    className={cn(
                      "text-title-md sm:text-display-sm text-ink truncate mt-1",
                      isCancelled && "line-through text-muted",
                    )}
                  >
                    {r.title}
                  </h3>
                  <p className="text-body-sm text-muted mt-1 truncate">
                    {room.name} · {room.location} · {r.attendees}명
                  </p>
                </div>
                <span
                  className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-badge"
                  style={
                    isCancelled
                      ? { background: "var(--color-surface-soft)", color: "var(--color-muted)" }
                      : r.status === "confirmed"
                        ? { background: color.fill, color: "#fff" }
                        : r.status === "pending"
                          ? {
                              background: "transparent",
                              color: "var(--color-ink)",
                              border: `1px dashed ${color.fill}`,
                            }
                          : { background: "var(--color-surface-soft)", color: "var(--color-muted)" }
                  }
                >
                  {isCancelled
                    ? "취소됨"
                    : r.status === "confirmed"
                      ? "확정"
                      : r.status === "pending"
                        ? "승인 대기"
                        : r.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-soft text-body-sm">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {formatTime(start)} – {formatTime(end)}
                </span>
                {!isCancelled && (
                  <button
                    type="button"
                    onClick={() => cancel(r.id)}
                    className="h-9 px-3 rounded-full text-caption text-error hover:underline"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
