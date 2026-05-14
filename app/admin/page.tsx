"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { ROOMS, getRoom, type ReservationDTO } from "@/lib/rooms";
import { cn, formatTime } from "@/lib/utils";

export default function AdminPage() {
  const [reservations, setReservations] = useState<ReservationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 오늘 + 향후 14일 합쳐서 가져온다
      const days = Array.from({ length: 14 }, (_, i) => i);
      const lists = await Promise.all(
        days.map((d) =>
          fetch(`/api/reservations?day=${d}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((j) => (j.reservations ?? []) as ReservationDTO[])
            .catch(() => []),
        ),
      );
      const all = lists.flat();
      // 시작 시간 오름차순
      all.sort((a, b) => a.startAt.localeCompare(b.startAt));
      setReservations(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function decide(id: string, status: "confirmed" | "rejected") {
    setBusy((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await refresh();
    } finally {
      setBusy((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }

  const pending = reservations.filter((r) => r.status === "pending");

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayCount = reservations.filter((r) => {
    const t = new Date(r.startAt).getTime();
    return t >= today0.getTime() && t < tomorrow.getTime();
  }).length;

  // 회의실별 이용률 (예약된 시간 / 가용 16시간, 14일 합산)
  const roomUtil = ROOMS.map((room) => {
    const used = reservations
      .filter((r) => r.roomId === room.id && r.status !== "cancelled" && r.status !== "rejected")
      .reduce((sum, r) => {
        const s = new Date(r.startAt).getTime();
        const e = new Date(r.endAt).getTime();
        return sum + (e - s) / (1000 * 60 * 60);
      }, 0);
    const total = 16 * 14; // 16시간 × 14일
    const pct = Math.min(100, Math.round((used / total) * 100));
    return { room, pct };
  });

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <header className="mb-8">
        <p className="text-uppercase-tag uppercase text-muted mb-1">관리자</p>
        <h1 className="text-display-xl text-ink">시설 운영</h1>
        <p className="text-body-md text-muted mt-1">
          오늘 {todayCount}건 예정 · 승인 대기 {pending.length}건 · 14일 합산 {reservations.length}건
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Kpi label="오늘 예약" value={String(todayCount)} />
        <Kpi label="승인 대기" value={String(pending.length)} />
        <Kpi label="14일 합산" value={String(reservations.length)} />
      </div>

      <section className="mb-10">
        <h2 className="text-display-md text-ink mb-3">승인 대기</h2>
        <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
          {loading ? (
            <div className="px-5 py-12 text-center text-body-md text-muted">불러오는 중…</div>
          ) : pending.length === 0 ? (
            <div className="px-5 py-12 text-center text-body-md text-muted">
              승인 대기 중인 예약이 없습니다.
            </div>
          ) : (
            pending.map((r) => {
              const room = getRoom(r.roomId);
              if (!room) return null;
              const start = new Date(r.startAt);
              const end = new Date(r.endAt);
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 px-5 py-4 border-b last:border-b-0 border-hairline-soft items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={room.photoUrl}
                      alt={room.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-sm shrink-0 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-title-sm text-ink truncate">{r.title}</p>
                      <p className="text-body-sm text-muted truncate">
                        {r.userName} · {r.employeeId} · {room.name} · {formatTime(start)}–{formatTime(end)} · {r.attendees}명
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      disabled={busy.has(r.id)}
                      onClick={() => decide(r.id, "rejected")}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-ink text-caption hover:bg-surface-soft disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> 거절
                    </button>
                    <button
                      disabled={busy.has(r.id)}
                      onClick={() => decide(r.id, "confirmed")}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-ink text-white text-caption disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> 승인
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-display-md text-ink mb-3">회의실 이용률 (14일)</h2>
        <div className="bg-canvas border border-hairline rounded-md p-5 space-y-4">
          {roomUtil.map(({ room, pct }) => (
            <div key={room.id} className="grid grid-cols-[180px_1fr_50px] items-center gap-3">
              <p className="text-body-md text-ink truncate">{room.name}</p>
              <div className="h-2 rounded-full bg-surface-strong overflow-hidden">
                <div className="h-full rounded-full bg-rausch" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-body-sm text-ink text-right tabular-nums">{pct}%</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-display-md text-ink mb-3">최근 예약</h2>
        <ul className="bg-canvas border border-hairline rounded-md divide-y divide-hairline-soft">
          {reservations.slice(0, 10).map((r) => {
            const room = getRoom(r.roomId);
            if (!room) return null;
            const start = new Date(r.startAt);
            const end = new Date(r.endAt);
            return (
              <li key={r.id} className="px-5 py-4 flex items-center gap-4">
                <Image
                  src={room.photoUrl}
                  alt={room.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-sm shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-title-sm text-ink truncate">{r.title}</p>
                  <p className="text-body-sm text-muted truncate">
                    {r.userName} · {room.name} · {formatTime(start)}–{formatTime(end)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-badge shrink-0",
                    r.status === "confirmed"
                      ? "bg-rausch-tint text-ink"
                      : r.status === "pending"
                        ? "bg-canvas border border-dashed border-rausch text-ink"
                        : "bg-surface-soft text-muted",
                  )}
                >
                  {r.status === "confirmed"
                    ? "확정"
                    : r.status === "pending"
                      ? "대기"
                      : r.status === "rejected"
                        ? "거절"
                        : r.status === "cancelled"
                          ? "취소"
                          : r.status}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas border border-hairline rounded-md p-5">
      <p className="text-body-sm text-muted">{label}</p>
      <p className="text-display-xl text-ink mt-2 leading-none">{value}</p>
    </div>
  );
}
