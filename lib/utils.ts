import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDateKo(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/** 해당 시간 슬롯이 이미 시작됐거나 지났는지 판정.
 *  예: 지금 11:24면 hour=11, 11 슬롯은 past(이미 시작됨). */
export function isPastSlot(hour: number, dayOffset: number, now?: Date): boolean {
  if (dayOffset > 0) return false;
  if (dayOffset < 0) return true;
  const n = now ?? new Date();
  return hour <= n.getHours();
}
