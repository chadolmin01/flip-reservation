import * as XLSX from "xlsx";
import type { Room } from "./rooms";

export type ExportRow = {
  startAt: Date;
  endAt: Date;
  title: string;
  userName: string;
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const pad2 = (n: number) => String(n).padStart(2, "0");

const fmtDate = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;

const fmtTime = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const hoursBetween = (s: Date, e: Date) =>
  Math.round((e.getTime() - s.getTime()) / 3_600_000);

/**
 * 우정원 창업지원실 월별사용일지 양식과 동일한 .xls 생성.
 * 상단 팀/대표자 정보는 빈 칸 (사용자가 채움), 데이터 행만 채움.
 */
export function generateUsageLogXls(opts: {
  month: number; // 1-12
  room: Room;
  rows: ExportRow[];
}): Buffer {
  const { month, room, rows } = opts;

  const aoa: (string | number | null)[][] = [
    [],
    [null, `${room.name} (${month})월 사용일지`],
    [],
    [null, null, null, null, null, "팀     명", null, ""],
    [null, null, null, null, null, "대표자", "소     속", ""],
    [null, null, null, null, null, null, "학     번", ""],
    [null, null, null, null, null, null, "성     명", ""],
    [null, null, null, null, null, null, "연 락 처", ""],
    [null, null, null, null, null, "호     실", null, room.location],
    [],
    ["연번", "일자", null, "사용시간", null, null, "활동내용", "비고"],
    [null, "날짜", "요일", "시작시간", "종료시간", "활동시간"],
  ];

  rows.forEach((r, i) => {
    aoa.push([
      i,
      fmtDate(r.startAt),
      DOW[r.startAt.getDay()],
      fmtTime(r.startAt),
      fmtTime(r.endAt),
      pad2(hoursBetween(r.startAt, r.endAt)),
      `${r.title} (${r.userName})`,
      "",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!merges"] = [
    { s: { r: 1, c: 1 }, e: { r: 1, c: 7 } }, // 제목 행
    { s: { r: 3, c: 5 }, e: { r: 3, c: 6 } }, // 팀명
    { s: { r: 4, c: 5 }, e: { r: 7, c: 5 } }, // 대표자
    { s: { r: 8, c: 5 }, e: { r: 8, c: 6 } }, // 호실
    { s: { r: 10, c: 1 }, e: { r: 10, c: 2 } }, // 일자
    { s: { r: 10, c: 3 }, e: { r: 10, c: 5 } }, // 사용시간
    { s: { r: 10, c: 0 }, e: { r: 11, c: 0 } }, // 연번 (세로)
    { s: { r: 10, c: 6 }, e: { r: 11, c: 6 } }, // 활동내용
    { s: { r: 10, c: 7 }, e: { r: 11, c: 7 } }, // 비고
  ];

  ws["!cols"] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 6 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 30 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "공간사용일지");

  return XLSX.write(wb, { bookType: "xls", type: "buffer" });
}
