import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
  name?: string;
  employeeId?: string;
};

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set in env (32+ chars)");
}

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: "flip_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export type PublicUser = {
  id: string;
  name: string;
  employeeId: string;
};

export async function getCurrentUser(): Promise<PublicUser | null> {
  const s = await getSession();
  if (!s.userId || !s.name || !s.employeeId) return null;
  return { id: s.userId, name: s.name, employeeId: s.employeeId };
}
