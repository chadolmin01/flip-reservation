// 사번별 고유 색상 — 사번 해시 → 8색 팔레트 매핑
// Airbnb 디자인 시스템과 어울리도록 채도를 약간 죽인 8종.

export type UserColor = {
  fill: string; // 확정 예약 블록 배경
  ring: string; // 점선/링 (대기, 아바타 등)
  name: string;
};

export const USER_PALETTE: UserColor[] = [
  { fill: "#5d7b9d", ring: "#3f5a7d", name: "flip" }, // FLIP 브랜드 색
  { fill: "#0d8a8a", ring: "#0b6e6e", name: "teal" },
  { fill: "#7c3aed", ring: "#5b21b6", name: "violet" },
  { fill: "#c47a09", ring: "#9a5f07", name: "amber" },
  { fill: "#3a8a4b", ring: "#2c6c39", name: "forest" },
  { fill: "#db2777", ring: "#a31157", name: "pink" },
  { fill: "#e85d3c", ring: "#b8421e", name: "coral" },
  { fill: "#475569", ring: "#334155", name: "slate" },
];

export function colorForUser(employeeId: string): UserColor {
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = ((hash << 5) - hash + employeeId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % USER_PALETTE.length;
  return USER_PALETTE[idx];
}
