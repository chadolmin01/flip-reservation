// 예약 한도 — 수치만 바꾸면 정책 변경
export const MAX_HOURS_PER_RESERVATION = 3;
export const MAX_HOURS_PER_WEEK = 20; // 팀(계정)당 주간 한도

// 주(週) 범위 — 일요일 00:00 ~ 다음 일요일 00:00 (한국 캘린더 관습)
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=일
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}
