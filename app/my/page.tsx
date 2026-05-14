"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QrCode, CalendarClock } from "lucide-react";
import { getRoom, type ReservationDTO } from "@/lib/rooms";
import { cn, formatDateKo, formatTime } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { colorForUser } from "@/lib/colors";

export default function MyPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations?mine=1", { cache: "no-store" });
      const json = await res.json();
      setReservations(json.reservations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;
  const color = colorForUser(user.employeeId);

  async function cancel(id: string) {
    if (!confirm("이 예약을 취소할까요?")) return;
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "취소에 실패했습니다");
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <div className="flex items-center gap-3 mb-2">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white font-medium"
          style={{ background: color.fill }}
        >
          {user.name.slice(0, 1)}
        </span>
        <h1 className="text-display-xl text-ink">{user.name}님의 예약</h1>
      </div>
      <p className="text-body-md text-muted mb-8">
        사번 <span className="text-ink font-medium">{user.employeeId}</span> 으로 만든 예약입니다.
      </p>

      {loading ? (
        <p className="text-body-md text-muted py-10 text-center">불러오는 중…</p>
      ) : reservations.length === 0 ? (
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
      ) : (
        <ul className="divide-y divide-hairline-soft">
          {reservations.map((r) => {
            const room = getRoom(r.roomId);
            if (!room) return null;
            const start = new Date(r.startAt);
            const end = new Date(r.endAt);
            const isCancelled = r.status === "cancelled";
            return (
              <li key={r.id} className="py-5 flex items-start gap-5">
                <div className={cn("relative w-24 h-24 rounded-md shrink-0 overflow-hidden bg-surface-soft", isCancelled && "opacity-40")}>
                  <Image
                    src={room.photoUrl}
                    alt={room.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                  <span className="absolute bottom-2 left-2 text-white text-caption font-medium drop-shadow">
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
                          "text-display-sm text-ink truncate mt-1",
                          isCancelled && "line-through text-muted",
                        )}
                      >
                        {r.title}
                      </h3>
                      <p className="text-body-sm text-muted mt-1">
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
                              ? { background: "transparent", color: "var(--color-ink)", border: `1px dashed ${color.fill}` }
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
                      <>
                        <Link
                          href={`/checkin/CHK-${r.id}`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-ink text-caption hover:bg-surface-soft transition"
                        >
                          <QrCode className="w-3.5 h-3.5" /> 체크인 QR
                        </Link>
                        <button
                          type="button"
                          onClick={() => cancel(r.id)}
                          className="h-9 px-3 rounded-full text-caption text-error hover:underline"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
