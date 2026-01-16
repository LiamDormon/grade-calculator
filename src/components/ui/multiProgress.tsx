import { cn } from "@/lib/utils"

export type Segment = { value: number; color?: string; title?: string }

export default function MultiProgress({ segments, className }: { segments: Segment[]; className?: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 100

  return (
    <div className={cn("multi-progress w-full overflow-hidden rounded-base border-2 border-border bg-secondary-background", className)}>
      <div className="flex h-4">
        {segments.map((seg, i) => {
          const w = (seg.value / total) * 100
          return (
            <div
              key={i}
              className="segment"
              title={seg.title}
              style={{ width: `${w}%`, background: seg.color || "var(--accent)" }}
            />
          )
        })}
      </div>
    </div>
  )
}
