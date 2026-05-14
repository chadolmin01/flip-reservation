"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROOMS, type ReservationDTO } from "@/lib/rooms";
import { formatDateKo, formatTime, isPastSlot } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { colorForUser } from "@/lib/colors";
import { useAuth } from "@/components/auth-provider";

const HOURS = Array.from({ length: 16 }, (_, i) => 8 + i); // 08..23
const TOTAL_HOURS = HOURS.length; // 16
const ROW_H = 44;

function dayLabel(date: Date, offset: number): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (offset === 0) return `${m}월 ${d}일 (오늘)`;
  if (offset === 1) return `${m}월 ${d}일 (내일)`;
  return formatDateKo(date);
}

export function TimelineCalendar({
  initialReservations = [],
}: {
  initialReservations?: ReservationDTO[]; // 14일치 전체
}) {
  const { user } = useAuth();
  const [dayOffset, setDayOffset] = useState(0);
  const [, setTick] = useState(0);

  // 1분마다 강제 리렌더 → 지난 시간 표시 자동 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  // 14일치 데이터에서 현재 날짜만 즉시 필터 — 화살표 클릭 시 fetch 없음
  const reservations = useMemo(() => {
    const dStart = baseDate.getTime();
    const dEnd = dStart + 86_400_000;
    return initialReservations.filter((r) => {
      const t = new Date(r.startAt).getTime();
      return t >= dStart && t < dEnd;
    });
  }, [initialReservations, baseDate]);

  const isToday = dayOffset === 0;

  return (
    <section className="rounded-md border border-hairline bg-canvas overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 날짜"
            onClick={() => setDayOffset((d) => d - 1)}
            className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-hairline hover:bg-surface-soft transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-display-sm text-ink min-w-[200px] text-center">
            {dayLabel(baseDate, dayOffset)}
          </h3>
          <button
            type="button"
            aria-label="다음 날짜"
            onClick={() => setDayOffset((d) => d + 1)}
            className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-hairline hover:bg-surface-soft transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDayOffset(0)}
              className="ml-1 text-caption-sm text-muted hover:text-ink hover:underline"
            >
              오늘로
            </button>
          )}
        </div>
      </div>

      {/* 모바일은 가로 스크롤, 데스크탑은 폭에 맞춰 fit */}
      <div className="overflow-x-auto md:overflow-visible">
       <div className="relative min-w-[760px] md:min-w-0">
        <div className="flex border-b border-hairline">
          <div className="w-[140px] shrink-0" />
          <div className="flex-1 flex">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex-1 min-w-0 text-caption-sm text-muted py-2 pl-1.5 tabular-nums border-l border-hairline-soft first:border-l-0"
              >
                {String(h).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        {ROOMS.map((room) => {
          const rowReservations = reservations.filter((r) => r.roomId === room.id);
          return (
            <div
              key={room.id}
              className="relative flex border-b border-hairline-soft last:border-b-0"
              style={{ height: ROW_H }}
            >
              <Link
                href={`/rooms/${room.id}`}
                className="w-[140px] shrink-0 flex items-center px-3 hover:bg-surface-soft transition border-r border-hairline"
              >
                <div className="min-w-0">
                  <p className="text-title-sm text-ink truncate">{room.name}</p>
                  <p className="text-caption-sm text-muted truncate">
                    {room.capacity}인
                  </p>
                </div>
              </Link>

              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-0 flex pointer-events-none">
                  {HOURS.map((h, i) => (
                    <div
                      key={h}
                      className={cn(
                        "flex-1 min-w-0",
                        i > 0 && "border-l border-hairline-soft",
                      )}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 flex">
                  {HOURS.map((h) => {
                    const past = isPastSlot(h, dayOffset);
                    return past ? (
                      <div
                        key={h}
                        className="flex-1 min-w-0 bg-surface-soft/80"
                        aria-label="지난 시간"
                      />
                    ) : (
                      <Link
                        key={h}
                        href={`/reserve?room=${room.id}&start=${h}:00&dayOffset=${dayOffset}`}
                        className="flex-1 min-w-0 hover:bg-rausch-tint/50 transition"
                        aria-label={`${room.name} ${h}시 예약`}
                      />
                    );
                  })}
                </div>

                {rowReservations.map((r) => (
                  <ReservationBlock
                    key={r.id}
                    r={r}
                    mine={user?.employeeId === r.employeeId}
                  />
                ))}
              </div>
            </div>
          );
        })}
       </div>
      </div>
    </section>
  );
}

function ReservationBlock({ r, mine }: { r: ReservationDTO; mine: boolean }) {
  const start = new Date(r.startAt);
  const end = new Date(r.endAt);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const leftPct = ((startHour - 8) / TOTAL_HOURS) * 100;
  const widthPct = ((endHour - startHour) / TOTAL_HOURS) * 100;

  const isPending = r.status === "pending";
  const c = colorForUser(r.employeeId);

  return (
    <div
      className="group absolute inset-y-0"
      style={{
        left: `${leftPct}%`,
        width: `calc(${widthPct}% - 1px)`,
      }}
    >
      <div
        className={cn(
          "h-full w-full cursor-pointer transition",
          isPending ? "bg-canvas border border-dashed" : "",
        )}
        style={{
          // c.fill + alpha (cc = 80%)
          background: isPending ? "transparent" : `${c.fill}cc`,
          borderColor: isPending ? c.fill : undefined,
          boxShadow: mine ? `inset 0 0 0 2px ${c.ring}` : undefined,
        }}
        title={`${r.title} · ${formatTime(start)}–${formatTime(end)} · ${r.userName}`}
      />

      <div
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2",
          "min-w-[200px] max-w-[280px] rounded-md border border-hairline bg-canvas shadow-card",
          "px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30",
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-medium shrink-0"
            style={{ background: c.fill }}
          >
            {r.userName.slice(0, 1)}
          </span>
          <p className="text-caption font-semibold text-ink truncate">{r.title}</p>
        </div>
        <p className="text-caption-sm text-muted">
          {formatTime(start)}–{formatTime(end)} · {r.userName}
        </p>
        <p className="text-caption-sm text-muted">
          {r.attendees}명 · {isPending ? "승인 대기" : "확정"}
          {mine && <span className="ml-1 text-ink font-medium">· 내 예약</span>}
        </p>
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-canvas border-r border-b border-hairline" />
      </div>
    </div>
  );
}
