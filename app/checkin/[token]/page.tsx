import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Users, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getRoom } from "@/lib/rooms";
import { formatDateKo, formatTime } from "@/lib/utils";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resId = token.replace(/^CHK-/, "");
  const r = await prisma.reservation.findUnique({
    where: { id: resId },
    include: { user: { select: { name: true } } },
  });
  if (!r) notFound();

  const room = getRoom(r.roomId);
  if (!room) notFound();

  return (
    <div className="mx-auto max-w-[640px] px-6 lg:px-10 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rausch-tint mb-4">
          <CheckCircle2 className="w-8 h-8 text-rausch" />
        </div>
        <h1 className="text-display-xl text-ink">체크인 완료</h1>
        <p className="text-body-md text-muted mt-2">
          {r.user.name}님, {room.name}을 잘 사용하세요.
        </p>
      </div>

      <div className="bg-canvas border border-hairline rounded-md shadow-card overflow-hidden">
        <div className="relative h-32 bg-surface-soft">
          <Image
            src={room.photoUrl}
            alt={room.name}
            fill
            sizes="640px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
          <span className="absolute bottom-3 left-4 text-white text-display-md drop-shadow">
            {room.name}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-uppercase-tag uppercase text-muted">예약</p>
            <p className="text-display-md text-ink mt-1">{r.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-body-sm">
            <Row icon={<MapPin className="w-4 h-4" />} k="위치" v={room.location} />
            <Row icon={<Users className="w-4 h-4" />} k="인원" v={`${r.attendees}명`} />
            <Row icon={<Clock className="w-4 h-4" />} k="시간" v={`${formatTime(r.startAt)} – ${formatTime(r.endAt)}`} />
            <Row icon={<CheckCircle2 className="w-4 h-4" />} k="날짜" v={formatDateKo(r.startAt)} />
          </div>

          <div className="border-t border-hairline pt-4 grid grid-cols-2 gap-3">
            <Link
              href={`/rooms/${room.id}`}
              className="inline-flex h-11 items-center justify-center rounded-sm border border-ink text-button-sm"
            >
              회의실 정보
            </Link>
            <Link
              href="/my"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-ink text-white text-button-sm"
            >
              내 예약으로
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 text-caption-sm text-muted space-y-1.5">
        <p>· 회의 종료 후 자리를 정돈해 주세요.</p>
        <p>· 시설 장애가 있다면 운영팀에 알려 주세요.</p>
      </div>
    </div>
  );
}

function Row({
  icon, k, v,
}: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted mt-0.5">{icon}</span>
      <div>
        <p className="text-caption-sm text-muted">{k}</p>
        <p className="text-body-md text-ink">{v}</p>
      </div>
    </div>
  );
}
