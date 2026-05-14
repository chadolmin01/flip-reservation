"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

const PUBLIC_PATHS = ["/login"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace("/");
  }, [ready, user, isPublic, router]);

  // 인증 확인 중 — 빈 화면 대신 정적인 셸을 표시
  if (!ready || (!user && !isPublic)) {
    return <LoadingShell />;
  }
  return <>{children}</>;
}

function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-muted">
        <Spinner />
        <span className="text-body-sm">불러오는 중…</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-5 h-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
