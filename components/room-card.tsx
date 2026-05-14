"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import type { Room } from "@/lib/rooms";

export function RoomCard({
  room,
  available = true,
  freeUntil,
}: {
  room: Room;
  available?: boolean;
  freeUntil?: string;
}) {
  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <div className="relative">
        {/* photo */}
        <div className="relative aspect-[1/1] w-full overflow-hidden rounded-md bg-surface-soft">
          <Image
            src={room.photoUrl}
            alt={room.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 540px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={room.isFavorite}
          />

          {/* 즐겨찾기 뱃지 */}
          {room.isFavorite && (
            <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full bg-white text-badge text-ink shadow-card">
              자주 쓰는 공간
            </span>
          )}

          {/* 비어있음 / 사용중 */}
          <span
            className={
              "absolute top-3 right-12 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-badge " +
              (available ? "bg-white text-ink" : "bg-ink text-white")
            }
          >
            <span
              className={
                "w-1.5 h-1.5 rounded-full " + (available ? "bg-rausch" : "bg-white")
              }
            />
            {available ? "지금 비어있음" : "사용중"}
          </span>

          {/* heart */}
          <button
            type="button"
            aria-label="저장"
            className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/15 transition"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <Heart className="w-[22px] h-[22px] text-white drop-shadow-sm" />
          </button>
        </div>

        {/* meta */}
        <div className="mt-3 space-y-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-title-md text-ink truncate">{room.name}</h3>
            <span className="text-body-sm text-ink shrink-0">
              <span className="font-medium">{room.capacity}</span>
              <span className="text-muted"> 인</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-body-sm text-muted">
            <MapPin className="w-[13px] h-[13px]" />
            <span className="truncate">{room.location}</span>
          </div>
          <p className="text-body-sm text-muted line-clamp-1">
            {room.equipment.slice(0, 3).join(" · ")}
          </p>
          <p className="text-body-sm text-ink pt-1">
            {available ? (
              <span className="font-medium">{freeUntil ?? "지금 사용 가능"}</span>
            ) : (
              <span className="text-muted">다음 예약 가능: 1시간 후</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
