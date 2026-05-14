// 사번별 고유 색상 — 사번 해시 → 8색 팔레트 매핑
// Airbnb 디자인 시스템과 어울리도록 채도를 약간 죽인 8종.

export type UserColor = {
  fill: string; // 확정 예약 블록 배경
  ring: string; // 점선/링 (대기, 아바타 등)
  name: string;
};

// 무광·중간 채도 8색 (Linear / Notion 풍). 흰 캔버스 위에서 서로 안 부딪치게 정렬.
export const USER_PALETTE: UserColor[] = [
  { fill: "#5d7b9d", ring: "#3f5a7d", name: "flip" },       // FLIP 브랜드 스틸블루 (유지)
  { fill: "#5e9b9b", ring: "#2d6e6e", name: "teal" },       // 세이지 틸
  { fill: "#7c87c0", ring: "#4a55a0", name: "indigo" },     // 부드러운 인디고
  { fill: "#c19a5b", ring: "#8a6720", name: "amber" },      // 따뜻한 탄
  { fill: "#6da27a", ring: "#3f7a52", name: "sage" },       // 더스티 그린
  { fill: "#c4869a", ring: "#8a4d62", name: "rose" },       // 더스티 로즈
  { fill: "#c87c64", ring: "#8a4d36", name: "terracotta" }, // 테라코타
  { fill: "#6b7488", ring: "#3f4858", name: "graphite" },   // 차콜
];

export function colorForUser(employeeId: string): UserColor {
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = ((hash << 5) - hash + employeeId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % USER_PALETTE.length;
  return USER_PALETTE[idx];
}
