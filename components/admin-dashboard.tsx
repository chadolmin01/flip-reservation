"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, X, Lock, Download } from "lucide-react";
import { ROOMS, getRoom, type ReservationDTO } from "@/lib/rooms";
import { cn, formatTime } from "@/lib/utils";

const ADMIN_PASSWORD = "FLIP1234";
const ADMIN_UNLOCK_KEY = "wjw_admin_unlocked";

export function AdminDashboard({
  initialReservations,
}: {
  initialReservations: ReservationDTO[];
}) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [pwReady, setPwReady] = useState(false);
  const [reservations, setReservations] = useState(initialReservations);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  // 세션 동안 잠금 해제 유지
  useEffect(() => {
    setUnlocked(sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "1");
    setPwReady(true);
  }, []);

  // 서버에서 새 데이터 들어오면 동기화 (router.refresh 후)
  useEffect(() => {
    setReservations(initialReservations);
  }, [initialReservations]);

  // 월별 내보내기 상태
  const todayDate = new Date();
  const currentMonthValue = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}`;
  const [exportMonth, setExportMonth] = useState(currentMonthValue);
  const [exportRoomId, setExportRoomId] = useState(ROOMS[0].id);

  function downloadExport() {
    const url = `/api/admin/export?month=${encodeURIComponent(exportMonth)}&room=${encodeURIComponent(exportRoomId)}`;
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

  async function decide(id: string, status: "confirmed" | "rejected") {
    setBusy((s) => new Set(s).add(id));
    // 낙관 업데이트
    const prev = reservations;
    setReservations((curr) =>
      curr.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setReservations(prev); // rollback
      } else {
        router.refresh(); // 다른 페이지(/)의 캐시도 같이 invalidate
      }
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
          오늘 {todayCount}건 예정 · 승인 대기 {pending.length}건 · 14일 합산 {reservations.length}건
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Kpi label="오늘 예약" value={String(todayCount)} />
        <Kpi label="승인 대기" value={String(pending.length)} />
        <Kpi label="14일 합산" value={String(reservations.length)} />
      </div>

      {/* 월별 사용일지 내보내기 */}
      <section className="mb-10">
        <h2 className="text-display-md text-ink mb-1">월별 사용일지 내보내기</h2>
        <p className="text-body-sm text-muted mb-3">
          창업지원실 양식과 동일한 .xls 파일로 다운로드됩니다.
        </p>
        <div className="bg-canvas border border-hairline rounded-md p-5 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-caption-sm text-muted mb-1.5">월</span>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="h-11 rounded-sm border border-hairline px-3 text-body-md focus:outline-none focus:border-2 focus:border-ink focus:px-[11px] transition tabular-nums"
            />
          </label>
          <label className="block">
            <span className="block text-caption-sm text-muted mb-1.5">회의실</span>
            <select
              value={exportRoomId}
              onChange={(e) => setExportRoomId(e.target.value)}
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
            className="inline-flex items-center gap-1.5 h-11 px-4 rounded-sm bg-ink text-white text-button-md hover:opacity-90"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-display-md text-ink mb-3">승인 대기</h2>
        <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
          {pending.length === 0 ? (
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
