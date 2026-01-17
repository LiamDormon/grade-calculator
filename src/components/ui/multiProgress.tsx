import { cn } from "@/lib/utils"

export type Segment = { value: number; color?: string; title?: string }

export default function MultiProgress({ segments, className }: { segments: Segment[]; className?: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 100

  return (
    <div className={cn("w-full overflow-hidden rounded-base border-2 border-border bg-secondary-background h-5 flex", className)}>
      <div className="flex h-full w-full">
        {segments.map((seg, i) => {
          const w = (seg.value / total) * 100
          return (
            <div
              key={i}
              className="h-full transition-all duration-300 ease-out border-r-2 border-border last:border-r-0"
              title={seg.title}
              style={{ width: `${w}%`, background: seg.color || "var(--chart-1)" }}
            />
          )
        })}
      </div>
    </div>
  )
}
