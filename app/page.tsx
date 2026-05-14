"use client";

import { TimelineCalendar } from "@/components/timeline-calendar";
import { RoomCard } from "@/components/room-card";
import { ROOMS } from "@/lib/rooms";
import { useAuth } from "@/components/auth-provider";
import { colorForUser } from "@/lib/colors";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      <section className="mb-12">
        <div className="flex items-center justify-end gap-3 text-caption-sm mb-3">
          {user && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: colorForUser(user.employeeId).fill }}
              />
              <span className="text-muted">내 예약 색상</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-muted" />
            <span className="text-muted">대기</span>
          </span>
        </div>
        <TimelineCalendar />
        <p className="text-caption-sm text-muted mt-2">
          예약된 블록의 색은 신청자별로 다릅니다. 빈 칸을 누르면 바로 예약 폼으로 이동합니다.
        </p>
      </section>

      <section className="mb-section">
        <h2 className="text-display-md text-ink mb-4">예약 가능한 공간</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
          {ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>
    </div>
  );
}
