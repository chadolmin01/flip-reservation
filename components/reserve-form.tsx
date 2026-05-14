"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Room, ReservationDTO } from "@/lib/rooms";
import { ROOMS } from "@/lib/rooms";
import { cn, formatDateKo, isPastSlot } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { colorForUser } from "@/lib/colors";

const MAX_DAYS = 14;

function dayLabel(offset: number): string {
  if (offset === 0) return "오늘";
  if (offset === 1) return "내일";
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return formatDateKo(d);
}

const HOURS = Array.from({ length: 16 }, (_, i) => 8 + i); // 08..23
const TOTAL_HOURS = HOURS.length; // 16
const ROW_H = 56;
const LABEL_W = 140;

const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function ReserveForm({
  room: initialRoom,
  startHour,
  dayOffset,
}: {
  room: Room;
  startHour?: string;
  dayOffset?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const initialH = startHour ? parseInt(startHour.split(":")[0], 10) : null;

  const [day, setDay] = useState<number>(() => {
    const n = dayOffset ? parseInt(dayOffset, 10) : 0;
    return Number.isFinite(n) && n >= 0 && n < MAX_DAYS ? n : 0;
  });
  const [selRoom, setSelRoom] = useState<string>(initialRoom.id);
  const [selStart, setSelStart] = useState<number | null>(initialH);
  const [selEnd, setSelEnd] = useState<number | null>(
    initialH != null ? initialH + 1 : null,
  );
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("4");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dayResvs, setDayResvs] = useState<ReservationDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reservations?day=${day}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setDayResvs(
          (json.reservations ?? []).filter(
            (r: ReservationDTO) =>
              r.status === "confirmed" || r.status === "pending",
          ),
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [day]);

  const conflict = useMemo(() => {
    if (selStart == null || selEnd == null) return false;
    return dayResvs.some((r) => {
      if (r.roomId !== selRoom) return false;
      const start = new Date(r.startAt);
      const end = new Date(r.endAt);
      const rs = start.getHours() + start.getMinutes() / 60;
      const re = end.getHours() + end.getMinutes() / 60;
      return !(selEnd <= rs || selStart >= re);
    });
  }, [dayResvs, selRoom, selStart, selEnd]);


  const room = ROOMS.find((r) => r.id === selRoom) ?? initialRoom;

  const applySelection = useCallback(
    (roomId: string, start: number, end: number) => {
      setSelRoom(roomId);
      setSelStart(start);
      setSelEnd(end);
    },
    [],
  );

  if (!user) return null;
  const color = colorForUser(user.employeeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selStart == null || selEnd == null || conflict || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() + day);
    const startAt = new Date(baseDate);
    startAt.setHours(Math.floor(selStart), Math.round((selStart % 1) * 60));
    const endAt = new Date(baseDate);
    endAt.setHours(Math.floor(selEnd), Math.round((selEnd % 1) * 60));

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selRoom,
          title: title.trim(),
          attendees: Number(attendees) || 1,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "예약에 실패했습니다");
      }
      setSubmitted(true);
      setTimeout(() => router.push("/my"), 1300);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "예약에 실패했습니다");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: `${color.fill}1a` }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: color.fill }} />
        </div>
        <h1 className="text-display-xl text-ink">예약이 접수되었습니다</h1>
        <p className="text-body-md text-muted mt-2">
          {user.name}님 · {room.name} · {dayLabel(day)} {fmtHour(selStart!)}–{fmtHour(selEnd!)}
        </p>
        <p className="text-caption-sm text-muted mt-4">잠시 후 내 예약 화면으로 이동합니다…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-caption text-ink hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> 캘린더로
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-soft">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-caption-sm font-medium"
            style={{ background: color.fill }}
          >
            {user.name.slice(0, 1)}
          </span>
          <span className="text-body-sm text-ink">
            {user.name}
            <span className="text-muted"> · {user.employeeId}</span>
          </span>
        </div>
      </div>

      <h1 className="text-display-xl text-ink mb-6">예약하기</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1단: 미니 캘린더 + 회의 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-10 items-start">
          <div>
            <p className="text-caption-sm text-muted mb-2">날짜 · 오늘부터 최대 2주</p>
            <MiniCalendar value={day} onChange={setDay} />
          </div>

          <div>
            <p className="text-caption-sm text-muted mb-2">회의 정보</p>
            <div className="space-y-3">
              <Field label="회의명">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 주간 정기 회의"
                  className={inputCls}
                />
              </Field>
              <Field label="참석 인원">
                <input
                  type="number"
                  min={1}
                  max={room.capacity}
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  className={inputCls + " w-32"}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* 2단: 시간 드래그 */}
        <div>
          <p className="text-caption-sm text-muted mb-2">시간</p>
          <SelectableCalendar
            dayResvs={dayResvs}
            dayOffset={day}
            selRoom={selRoom}
            selStart={selStart}
            selEnd={selEnd}
            userColor={color.fill}
            userRing={color.ring}
            userId={user.employeeId}
            conflict={conflict}
            onSelect={applySelection}
          />
          <p className="text-caption-sm text-muted mt-2">
            시간 칸을 클릭하고 드래그하세요.
          </p>
        </div>

        {/* 3단: 선택 요약 + 제출 */}
        <div className="rounded-md border border-hairline bg-canvas p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {selStart != null && selEnd != null ? (
              <>
                <p className="text-title-sm text-ink truncate">
                  {room.name} · {dayLabel(day)} {fmtHour(selStart)}–{fmtHour(selEnd)}
                </p>
                <p className="text-body-sm text-muted mt-0.5">
                  {(selEnd - selStart) * 60}분
                  {conflict && (
                    <span className="ml-2 inline-flex items-center gap-1 text-error font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      다른 예약과 겹칩니다
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-body-md text-muted">위 캘린더에서 시간 범위를 선택하세요</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {selStart != null && selEnd != null && (
              <button
                type="button"
                onClick={() => {
                  setSelStart(null);
                  setSelEnd(null);
                }}
                className="text-caption-sm text-muted hover:text-ink hover:underline"
              >
                해제
              </button>
            )}
            <button
              type="submit"
              disabled={
                !title.trim() ||
                selStart == null ||
                selEnd == null ||
                conflict ||
                submitting
              }
              className="h-11 px-6 rounded-sm text-white text-button-md transition disabled:opacity-40"
              style={{ background: color.fill }}
            >
              {submitting
                ? "처리 중…"
                : room.requiresApproval
                  ? "예약 요청 보내기"
                  : "예약 확정하기"}
            </button>
          </div>
        </div>
        {submitError && (
          <p className="text-caption-sm text-error -mt-2">{submitError}</p>
        )}
      </form>
    </div>
  );
}

/* ----- 선택 가능한 캘린더 (드래그 지원) ----- */

function SelectableCalendar({
  dayResvs, dayOffset, selRoom, selStart, selEnd, userColor, userRing, userId, conflict, onSelect,
}: {
  dayResvs: ReservationDTO[];
  dayOffset: number;
  selRoom: string;
  selStart: number | null;
  selEnd: number | null;
  userColor: string;
  userRing: string;
  userId: string;
  conflict: boolean;
  onSelect: (roomId: string, start: number, end: number) => void;
}) {
  // 드래그 시작 지점 — null이면 드래그 중 아님
  const [dragFrom, setDragFrom] = useState<{ roomId: string; hour: number } | null>(null);

  useEffect(() => {
    if (!dragFrom) return;

    function findSlot(x: number, y: number) {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const slot = el.closest("[data-slot]") as HTMLElement | null;
      if (!slot) return null;
      const roomId = slot.getAttribute("data-room");
      const hourStr = slot.getAttribute("data-hour");
      if (!roomId || hourStr == null) return null;
      return { roomId, hour: Number(hourStr) };
    }

    function onMove(e: PointerEvent) {
      const found = findSlot(e.clientX, e.clientY);
      if (!found) return;
      if (found.roomId !== dragFrom!.roomId) return;
      if (isPastSlot(found.hour, dayOffset)) return; // 지난 시간엔 확장 안 함
      const a = Math.min(dragFrom!.hour, found.hour);
      const b = Math.max(dragFrom!.hour, found.hour);
      onSelect(found.roomId, a, b + 1);
    }
    function onStop() {
      setDragFrom(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onStop);
    window.addEventListener("pointercancel", onStop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onStop);
      window.removeEventListener("pointercancel", onStop);
    };
  }, [dragFrom, onSelect, dayOffset]);

  return (
    <section
      className="rounded-md border border-hairline bg-canvas overflow-hidden"
      style={{ touchAction: "none", userSelect: "none" }}
    >
      {/* hour header */}
      <div className="flex border-b border-hairline">
        <div style={{ width: LABEL_W }} className="shrink-0 px-3 py-2 text-caption-sm text-muted">
          공간
        </div>
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
        const rowResvs = dayResvs.filter((r) => r.roomId === room.id);
        return (
          <div
            key={room.id}
            className="relative flex border-b border-hairline-soft last:border-b-0"
            style={{ height: ROW_H }}
          >
            <div
              style={{ width: LABEL_W }}
              className="shrink-0 flex items-center gap-2 px-3 border-r border-hairline"
            >
              <Image
                src={room.photoUrl}
                alt={room.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-sm shrink-0 object-cover"
              />
              <div className="min-w-0">
                <p className="text-title-sm text-ink truncate">{room.name}</p>
                <p className="text-caption-sm text-muted truncate">{room.capacity}인</p>
              </div>
            </div>

            <div className="relative flex-1 min-w-0">
              {/* grid lines */}
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

              {/* clickable + draggable slots */}
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
                    <div
                      key={h}
                      data-slot
                      data-room={room.id}
                      data-hour={h}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setDragFrom({ roomId: room.id, hour: h });
                        onSelect(room.id, h, h + 1);
                      }}
                      className="flex-1 min-w-0 hover:bg-rausch-tint transition cursor-pointer"
                      aria-label={`${room.name} ${h}시`}
                      role="button"
                    />
                  );
                })}
              </div>

              {/* existing reservations */}
              {rowResvs.map((r) => {
                const start = new Date(r.startAt);
                const end = new Date(r.endAt);
                const sh = start.getHours() + start.getMinutes() / 60;
                const eh = end.getHours() + end.getMinutes() / 60;
                const left = ((sh - 8) / TOTAL_HOURS) * 100;
                const width = ((eh - sh) / TOTAL_HOURS) * 100;
                const c = colorForUser(r.employeeId);
                const mine = r.employeeId === userId;
                return (
                  <div
                    key={r.id}
                    className="absolute top-2 bottom-2 rounded-sm pointer-events-none"
                    style={{
                      left: `${left}%`,
                      width: `calc(${width}% - 2px)`,
                      background: c.fill,
                      opacity: 0.85,
                      boxShadow: mine ? `0 0 0 2px ${c.ring}` : undefined,
                    }}
                    title={`${r.title} · ${r.userName}`}
                  />
                );
              })}

              {/* selected range */}
              {selRoom === room.id && selStart != null && selEnd != null && (
                <div
                  className="absolute top-1 bottom-1 rounded-sm pointer-events-none"
                  style={{
                    left: `${((selStart - 8) / TOTAL_HOURS) * 100}%`,
                    width: `calc(${((selEnd - selStart) / TOTAL_HOURS) * 100}% - 2px)`,
                    background: conflict ? "#fef2ef" : `${userColor}33`,
                    border: `2px solid ${conflict ? "#c13515" : userRing}`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ----- 미니 캘린더 (2주) ----- */

function MiniCalendar({
  value,
  onChange,
}: {
  value: number;
  onChange: (offset: number) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayDow = today.getDay(); // 0=Sun..6=Sat
  const numRows = Math.ceil((todayDow + MAX_DAYS) / 7);
  const startOffset = -todayDow;

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  // 표시되는 첫·마지막 cell의 월을 헤더에 표시
  const firstMonth = new Date(today);
  firstMonth.setDate(today.getDate() + startOffset);
  const lastMonth = new Date(today);
  lastMonth.setDate(today.getDate() + startOffset + numRows * 7 - 1);
  const monthLabel =
    firstMonth.getMonth() === lastMonth.getMonth()
      ? `${firstMonth.getMonth() + 1}월`
      : `${firstMonth.getMonth() + 1}월 – ${lastMonth.getMonth() + 1}월`;

  return (
    <div className="inline-block">
      <p className="text-title-sm text-ink mb-2">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((w, i) => (
          <div
            key={w}
            className={cn(
              "w-10 h-7 flex items-center justify-center text-caption-sm",
              i === 0 ? "text-error" : i === 6 ? "text-legal-link" : "text-muted",
            )}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: numRows * 7 }, (_, i) => {
          const offset = startOffset + i;
          const d = new Date(today);
          d.setDate(today.getDate() + offset);
          const dayNum = d.getDate();
          const isToday = offset === 0;
          const isSelected = offset === value;
          const disabled = offset < 0 || offset >= MAX_DAYS;
          const dow = d.getDay();

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(offset)}
              className={cn(
                "w-10 h-10 rounded-full text-body-sm transition tabular-nums",
                disabled && "text-muted-soft/50 cursor-not-allowed",
                !disabled && !isSelected && "text-ink hover:bg-surface-soft",
                !disabled && !isSelected && dow === 0 && "text-error",
                !disabled && !isSelected && dow === 6 && "text-legal-link",
                isSelected && "bg-ink text-white font-medium",
                isToday && !isSelected && "ring-1 ring-ink",
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption-sm text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-12 rounded-sm border border-hairline px-3.5 text-body-md placeholder:text-muted-soft focus:outline-none focus:border-2 focus:border-ink focus:px-[13px] transition w-full";
