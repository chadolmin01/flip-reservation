import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

function generateEmployeeId(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `U${n}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const { name, pin } = (body ?? {}) as { name?: string; pin?: string };
  const trimmedName = (name ?? "").trim();

  if (!trimmedName) {
    return NextResponse.json({ error: "이름을 입력하세요" }, { status: 400 });
  }
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "PIN은 4자리 숫자입니다" }, { status: 400 });
  }

  // 같은 이름의 사용자 중 PIN이 일치하는 사람 찾기
  const candidates = await prisma.user.findMany({ where: { name: trimmedName } });
  for (const u of candidates) {
    if (await bcrypt.compare(pin, u.pinHash)) {
      const session = await getSession();
      session.userId = u.id;
      session.name = u.name;
      session.employeeId = u.employeeId;
      await session.save();
      return NextResponse.json({
        user: { id: u.id, name: u.name, employeeId: u.employeeId },
        isNew: false,
      });
    }
  }

  // 신규 사용자 — 사번 자동 발급 (중복 회피)
  const pinHash = await bcrypt.hash(pin, 10);
  let employeeId = generateEmployeeId();
  for (let i = 0; i < 30; i++) {
    const exists = await prisma.user.findUnique({ where: { employeeId } });
    if (!exists) break;
    employeeId = generateEmployeeId();
  }

  const created = await prisma.user.create({
    data: { name: trimmedName, employeeId, pinHash },
  });

  const session = await getSession();
  session.userId = created.id;
  session.name = created.name;
  session.employeeId = created.employeeId;
  await session.save();

  return NextResponse.json({
    user: { id: created.id, name: created.name, employeeId: created.employeeId },
    isNew: true,
  });
}
