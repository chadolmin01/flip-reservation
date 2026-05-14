export function SiteFooter() {
  return (
    <footer className="bg-canvas border-t border-hairline mt-section">
      <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-caption-sm text-muted">
          © 2026 FLIP · 회의실 · 동아리실 예약 시스템
        </p>
        <p className="text-caption-sm text-muted">
          문의: 운영팀 ·{" "}
          <a href="tel:01046319554" className="text-ink hover:underline">
            010-4631-9554
          </a>
        </p>
      </div>
    </footer>
  );
}
