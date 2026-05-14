"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Lock, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { ROOMS, getRoom, type ReservationDTO } from "@/lib/rooms";
import { cn, formatDateKo, formatTime } from "@/lib/utils";

const ADMIN_PASSWORD = "FLIP1234";
const ADMIN_UNLOCK_KEY = "wjw_admin_unlocked";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}
function monthLabel(key: string): string {
  const [, m] = key.split("-").map(Number);
  return `${m}월`;
}

export function AdminDashboard({
  initialReservations,
}: {
  initialReservations: ReservationDTO[];
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pwReady, setPwReady] = useState(false);
  const reservations = initialReservations;

  // 세션 동안 잠금 해제 유지
  useEffect(() => {
    setUnlocked(sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "1");
    setPwReady(true);
  }, []);

  // 월별 보기 + 내보내기 통합 상태
  const currentMonthValue = useMemo(() => monthKey(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [selectedRoomId, setSelectedRoomId] = useState(ROOMS[0].id);
  const [monthData, setMonthData] = useState<ReservationDTO[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  // 월/회의실 바뀌면 해당 월 데이터 새로 페치
  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setMonthLoading(true);
    fetch(
      `/api/admin/reservations?month=${encodeURIComponent(selectedMonth)}&room=${encodeURIComponent(selectedRoomId)}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setMonthData(json.reservations ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMonthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedRoomId, unlocked]);

  function downloadExport() {
    const url = `/api/admin/export?month=${encodeURIComponent(selectedMonth)}&room=${encodeURIComponent(selectedRoomId)}`;
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (!pwReady) return null;
  if (!unlocked) {
    return (
      <AdminGate
        onUnlock={() => {
          sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
          setUnlocked(true);
        }}
      />
    );
  }

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayCount = reservations.filter((r) => {
    const t = new Date(r.startAt).getTime();
    return t >= today0.getTime() && t < tomorrow.getTime();
  }).length;

  const roomUtil = ROOMS.map((room) => {
    const used = reservations
      .filter(
        (r) =>
          r.roomId === room.id &&
          r.status !== "cancelled" &&
          r.status !== "rejected",
      )
      .reduce((sum, r) => {
        const s = new Date(r.startAt).getTime();
        const e = new Date(r.endAt).getTime();
        return sum + (e - s) / (1000 * 60 * 60);
      }, 0);
    const total = 16 * 14;
    const pct = Math.min(100, Math.round((used / total) * 100));
    return { room, pct };
  });

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <header className="mb-8">
        <p className="text-uppercase-tag uppercase text-muted mb-1">관리자</p>
        <h1 className="text-display-xl text-ink">시설 운영</h1>
        <p className="text-body-md text-muted mt-1">
          오늘 {todayCount}건 예정 · 14일 합산 {reservations.length}건
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <Kpi label="오늘 예약" value={String(todayCount)} />
        <Kpi label="14일 합산" value={String(reservations.length)} />
      </div>

      {/* 월별 사용 — 월/회의실 필터 + 다운로드 + 리스트 */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-display-md text-ink">
            월별 사용 — <span className="text-rausch">{monthLabel(selectedMonth)}</span>
          </h2>
          <p className="text-body-sm text-muted">
            창업지원실 양식과 동일한 .xls 다운로드 가능
          </p>
        </div>

        {/* 컨트롤 바 */}
        <div className="bg-canvas border border-hairline rounded-md p-4 flex flex-wrap items-end gap-3 mb-3">
          {/* 월 네비게이션 (이전/현재 picker/다음) */}
          <div className="block">
            <span className="block text-caption-sm text-muted mb-1.5">월</span>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                aria-label="이전 달"
                onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
                className="w-9 h-11 inline-flex items-center justify-center rounded-sm border border-hairline hover:bg-surface-soft"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-11 rounded-sm border border-hairline px-3 text-body-md focus:outline-none focus:border-2 focus:border-ink focus:px-[11px] transition tabular-nums"
              />
              <button
                type="button"
                aria-label="다음 달"
                onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
                className="w-9 h-11 inline-flex items-center justify-center rounded-sm border border-hairline hover:bg-surface-soft"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {selectedMonth !== currentMonthValue && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth(currentMonthValue)}
                  className="ml-1 text-caption-sm text-muted hover:text-ink hover:underline"
                >
                  이번 달
                </button>
              )}
            </div>
          </div>

          <label className="block">
            <span className="block text-caption-sm text-muted mb-1.5">회의실</span>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="h-11 rounded-sm border border-hairline px-3 text-body-md focus:outline-none focus:border-2 focus:border-ink focus:px-[11px] transition bg-canvas appearance-none pr-8"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23222' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              {ROOMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.location}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={downloadExport}
            className="inline-flex items-center gap-1.5 h-11 px-4 rounded-sm bg-ink text-white text-button-md hover:opacity-90 ml-auto"
          >
            <Download className="w-4 h-4" />
            .xls 다운로드
          </button>
        </div>

        {/* 월별 리스트 */}
        <ul className="bg-canvas border border-hairline rounded-md divide-y divide-hairline-soft">
          {monthLoading ? (
            <li className="px-5 py-12 text-center text-body-md text-muted">불러오는 중…</li>
          ) : monthData.length === 0 ? (
            <li className="px-5 py-12 text-center text-body-md text-muted">
              {monthLabel(selectedMonth)}에 해당 회의실 예약이 없습니다.
            </li>
          ) : (
            monthData.map((r) => {
              const room = getRoom(r.roomId);
              if (!room) return null;
              const start = new Date(r.startAt);
              const end = new Date(r.endAt);
              const isCancelled = r.status === "cancelled";
              return (
                <li
                  key={r.id}
                  className={cn(
                    "px-5 py-4 flex items-center gap-4",
                    isCancelled && "opacity-60",
                  )}
                >
                  <Image
                    src={room.photoUrl}
                    alt={room.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-sm shrink-0 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-title-sm text-ink truncate",
                        isCancelled && "line-through",
                      )}
                    >
                      {r.title}
                    </p>
                    <p className="text-body-sm text-muted truncate">
                      <span className="text-ink tabular-nums">{formatDateKo(start)}</span>
                      {" · "}
                      <span className="tabular-nums">
                        {formatTime(start)}–{formatTime(end)}
                      </span>
                      {" · "}
                      {r.userName} · {r.attendees}명
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-badge shrink-0",
                      r.status === "confirmed"
                        ? "bg-rausch-tint text-ink"
                        : "bg-surface-soft text-muted",
                    )}
                  >
                    {r.status === "confirmed"
                      ? "확정"
                      : r.status === "cancelled"
                        ? "취소"
                        : r.status === "rejected"
                          ? "거절"
                          : r.status}
                  </span>
                </li>
              );
            })
          )}
        </ul>
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

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError("비밀번호가 일치하지 않습니다");
      setPw("");
    }
  }

  return (
    <div className="mx-auto max-w-[420px] px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-soft mb-4">
        <Lock className="w-7 h-7 text-ink" />
      </div>
      <h1 className="text-display-xl text-ink">관리자 페이지</h1>
      <p className="text-body-md text-muted mt-2">
        관리자 비밀번호를 입력하세요.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3 text-left">
        <input
          type="password"
          required
          autoFocus
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError(null);
          }}
          placeholder="비밀번호"
          className="w-full h-12 rounded-sm border border-hairline px-3.5 text-body-md placeholder:text-muted-soft focus:outline-none focus:border-2 focus:border-ink focus:px-[13px] transition"
        />
        {error && <p className="text-caption-sm text-error">{error}</p>}
        <button
          type="submit"
          disabled={!pw}
          className="w-full h-12 rounded-sm bg-rausch text-white text-button-md hover:bg-rausch-active disabled:bg-rausch-disabled transition"
        >
          들어가기
        </button>
      </form>
    </div>
  );
}
