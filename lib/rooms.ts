// 회의실 정적 설정 — DB에 저장하지 않는 고정 데이터
export type Room = {
  id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  photoUrl: string;
  description: string;
  requiresApproval: boolean;
  isFavorite?: boolean;
};

export const ROOMS: Room[] = [
  {
    id: "meeting",
    name: "우정원",
    capacity: 10,
    location: "우정원 지하 1층 129호",
    equipment: ["55인치 TV 스크린", "화이트보드", "서랍"],
    photoUrl: "/rooms/meeting.jpg",
    description:
      "우정원 지하 1층에 자리한 회의실입니다. 55인치 TV 스크린과 화이트보드를 갖춰 발표와 회의에 적합하며, 자료 보관용 서랍이 있어 정기 회의 자료를 비치해 두기 좋습니다. 최대 10명이 함께 사용할 수 있습니다.",
    requiresApproval: false,
    isFavorite: true,
  },
  {
    id: "club",
    name: "동아리실",
    capacity: 5,
    location: "학생회관 413호",
    equipment: ["소파", "휴식 공간"],
    photoUrl: "/rooms/club.jpg",
    description:
      "학생회관 413호에 위치한 휴식 겸 모임 공간입니다. 소파와 휴식 공간이 마련되어 있어 가벼운 모임과 회의에 어울립니다. 최대 5명이 편안하게 사용할 수 있습니다.",
    requiresApproval: false,
    isFavorite: true,
  },
];

export function getRoom(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}

// API에서 받는 예약 데이터 shape
export type ReservationDTO = {
  id: string;
  roomId: string;
  title: string;
  attendees: number;
  startAt: string; // ISO
  endAt: string; // ISO
  status: "confirmed" | "pending" | "rejected" | "cancelled" | "no_show";
  userName: string;
  employeeId: string;
  mine?: boolean;
};
