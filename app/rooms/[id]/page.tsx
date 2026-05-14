import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Users, MapPin, Projector, Video, PenSquare,
  Volume2, Monitor, Wifi, ShieldCheck, Sofa, Coffee, Archive, Tv,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getRoom } from "@/lib/rooms";
import { ReservationCard } from "@/components/reservation-card";
import { prisma } from "@/lib/db";
import { formatTime } from "@/lib/utils";

const equipmentIcon: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "55인치 TV 스크린": Tv,
  "55인치 디스플레이": Monitor,
  "화이트보드": PenSquare,
  "서랍": Archive,
  "소파": Sofa,
  "휴식 공간": Coffee,
  "빔프로젝터": Projector,
  "화상회의 카메라": Video,
  "강의 음향": Volume2,
};

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = getRoom(id);
  if (!room) notFound();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const todayReservations = await prisma.reservation.findMany({
    where: {
      roomId: room.id,
      startAt: { gte: start, lt: end },
      status: { in: ["confirmed", "pending"] },
    },
    include: { user: { select: { name: true } } },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10">
      {/* back link — 홈으로 */}
      <div className="pt-6 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-caption text-ink hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> 캘린더로
        </Link>
      </div>

      {/* 제목 */}
      <header className="mb-6">
        <h1 className="text-display-lg text-ink">{room.name}</h1>
        <p className="text-body-md text-muted mt-1">
          {room.location} · 정원 {room.capacity}명
        </p>
      </header>

      {/* 사진 갤러리 (Airbnb 스타일) */}
      <section className="grid gap-2 mb-10 rounded-xl overflow-hidden aspect-[2/1] grid-cols-4 grid-rows-2">
        {/* 메인 — 좌측 절반 */}
        <div className="relative col-span-2 row-span-2 bg-surface-soft">
          <Image
            src={room.photos[0]}
            alt={`${room.name} 메인 사진`}
            fill
            sizes="(max-width: 1080px) 100vw, 540px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-5 left-6 text-white text-display-xl drop-shadow">
            {room.name}
          </span>
        </div>

        {/* 서브 사진 — 2x2 (최대 4장). 사진 부족하면 surface-soft fallback */}
        {[1, 2, 3, 4].map((i) => {
          const photo = room.photos[i];
          return (
            <div key={i} className="relative bg-surface-soft">
              {photo && (
                <Image
                  src={photo}
                  alt={`${room.name} 사진 ${i + 1}`}
                  fill
                  sizes="270px"
                  className="object-cover"
                />
              )}
            </div>
          );
        })}
      </section>

      {/* body — 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        <article>
          {/* 핵심 특징 */}
          <section className="pb-8 border-b border-hairline space-y-6">
            <Feature
              icon={<ShieldCheck className="w-6 h-6" strokeWidth={1.5} />}
              title={room.requiresApproval ? "관리자 승인 필요" : "즉시 확정"}
              sub={
                room.requiresApproval
                  ? "예약 요청 후 시설운영팀의 승인을 거쳐 확정됩니다."
                  : "예약 즉시 확정되며 알림이 발송됩니다."
              }
            />
            <Feature
              icon={<Users className="w-6 h-6" strokeWidth={1.5} />}
              title={`정원 ${room.capacity}명`}
              sub="좌석 배치는 자율 조정 가능합니다."
            />
            <Feature
              icon={<MapPin className="w-6 h-6" strokeWidth={1.5} />}
              title={room.location}
              sub="안내판에 회의실 표시가 있습니다."
            />
          </section>

          {/* 소개 */}
          <section className="py-8 border-b border-hairline">
            <p className="text-body-md text-body">{room.description}</p>
          </section>

          {/* 장비 */}
          <section className="py-8 border-b border-hairline">
            <h3 className="text-display-md text-ink mb-4">장비</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              {room.equipment.map((e) => {
                const Icon = equipmentIcon[e] ?? Wifi;
                return (
                  <li key={e} className="flex items-center gap-3 py-2">
                    <Icon className="w-5 h-5 stroke-ink" strokeWidth={1.5} />
                    <span className="text-body-md text-ink">{e}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 오늘 예약 현황 */}
          <section className="py-8">
            <h3 className="text-display-md text-ink mb-4">오늘 예약</h3>
            {todayReservations.length === 0 ? (
              <p className="text-body-sm text-muted">예정된 예약이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {todayReservations.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-title-sm text-ink">{r.title}</p>
                      <p className="text-body-sm text-muted">{r.user.name} · {r.attendees}명</p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-md text-ink font-medium">
                        {formatTime(r.startAt)}–{formatTime(r.endAt)}
                      </p>
                      <p className="text-caption-sm text-muted">
                        {r.status === "pending" ? "승인 대기" : "확정"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        {/* sticky reservation card */}
        <aside className="lg:sticky lg:top-24 self-start">
          <ReservationCard room={room} />
        </aside>
      </div>
    </div>
  );
}

function Feature({
  icon, title, sub,
}: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-title-md text-ink">{title}</p>
        <p className="text-body-sm text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
