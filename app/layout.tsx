import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "FLIP — 이용시설 예약",
  description: "FLIP 동아리 이용시설 예약 시스템 (우정원 · 동아리실)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <AuthProvider>
          <AuthGate>
            <TopNav />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <SiteFooter />
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
