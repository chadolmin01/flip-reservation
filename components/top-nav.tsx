"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { colorForUser } from "@/lib/colors";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "예약" },
  { href: "/my", label: "내 예약" },
];

export function TopNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
      <div className="mx-auto max-w-[1080px] h-16 px-6 lg:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/flip-mark.png"
            alt="FLIP"
            width={32}
            height={32}
            priority
            className="w-8 h-8 object-contain"
          />
          <span className="text-title-md text-rausch tracking-tight font-semibold">FLIP 예약</span>
        </Link>

        <nav className="flex items-center gap-2" aria-label="주요 탐색">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "h-9 px-3 inline-flex items-center rounded-full text-body-md transition",
                  active ? "bg-ink text-white" : "text-ink hover:bg-surface-soft",
                )}
              >
                {t.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className={cn(
              "h-9 px-3 inline-flex items-center rounded-full text-body-sm transition",
              pathname.startsWith("/admin")
                ? "bg-ink text-white"
                : "text-muted hover:text-ink hover:bg-surface-soft",
            )}
          >
            관리자
          </Link>

          {user && (
            <div className="ml-3 pl-3 border-l border-hairline flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-caption-sm font-medium"
                  style={{ background: colorForUser(user.employeeId).fill }}
                  title={`색상: ${colorForUser(user.employeeId).name}`}
                >
                  {user.name.slice(0, 1)}
                </span>
                <span className="text-body-sm text-ink">
                  {user.name}
                  <span className="text-muted"> · {user.employeeId}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-soft text-muted hover:text-ink transition"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
