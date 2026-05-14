// 서버 컴포넌트가 데이터를 불러오는 동안 보여줄 스켈레톤
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1080px] px-6 lg:px-10 py-8">
      {/* 레전드 자리 */}
      <div className="flex items-center justify-end gap-3 mb-3 h-5">
        <Pulse className="w-24 h-4 rounded-sm" />
        <Pulse className="w-12 h-4 rounded-sm" />
      </div>

      {/* 타임라인 스켈레톤 */}
      <section className="rounded-md border border-hairline bg-canvas overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Pulse className="w-8 h-8 rounded-full" />
            <Pulse className="w-44 h-7 rounded-sm" />
            <Pulse className="w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="flex border-b border-hairline">
          <div className="w-[140px] shrink-0" />
          <div className="flex-1 flex">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="flex-1 min-w-0 py-2 pl-1.5 border-l border-hairline-soft first:border-l-0">
                <Pulse className="w-6 h-3 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
        {[0, 1].map((row) => (
          <div key={row} className="flex border-b border-hairline-soft last:border-b-0 h-11">
            <div className="w-[140px] shrink-0 flex items-center px-3 border-r border-hairline">
              <div className="space-y-1">
                <Pulse className="w-16 h-3.5 rounded-sm" />
                <Pulse className="w-10 h-3 rounded-sm" />
              </div>
            </div>
            <div className="flex-1 min-w-0" />
          </div>
        ))}
      </section>

      <p className="text-caption-sm text-muted mt-2">불러오는 중…</p>

      <section className="mt-12">
        <Pulse className="w-44 h-7 rounded-sm mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
          {[0, 1].map((i) => (
            <div key={i}>
              <Pulse className="aspect-[1/1] w-full rounded-md" />
              <div className="mt-3 space-y-2">
                <Pulse className="w-32 h-4 rounded-sm" />
                <Pulse className="w-48 h-3.5 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Pulse({ className }: { className?: string }) {
  return <div className={`bg-surface-strong animate-pulse ${className ?? ""}`} />;
}
