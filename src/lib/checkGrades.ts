import { sample } from "./store"
import { useGradeStore } from "./store"

// simple validator for local development - checks module weights and that incomplete assignments are ignored
export function validateSnapshot(snapshot: any) {
  const errors: string[] = []

  if (!snapshot || !Array.isArray(snapshot.years)) {
    errors.push("No years found")
    return errors
  }

  snapshot.years.forEach((y: any) => {
    y.modules.forEach((m: any) => {
      const sum = m.assignments.reduce((s: number, a: any) => s + (a.weight ?? 0), 0)
      if (Math.abs(sum - 100) > 0.001) errors.push(`${y.name} / ${m.code} assignment weights sum to ${sum}%`)
    })
  })

  return errors
}

if (typeof globalThis !== "undefined" && (globalThis as any).process) {
  const s = sample
  const errors = validateSnapshot(s)
  if (errors.length > 0) {
    console.error("Validation errors:\n", errors.join("\n"))
    ;(globalThis as any).process.exit(1)
  }

  // run a quick check that incomplete assignments are not counted
  const state = useGradeStore.getState()

  const cs101Avg = state.getModuleAverage("year-1", "mod-1")
  if (cs101Avg === undefined || Math.abs(cs101Avg - 24) > 0.1) {
    console.error(`CS101 avg expected ~24, got ${cs101Avg}`)
    ;(globalThis as any).process.exit(1)
  }

  const segments = state.getModuleSegments("year-1", "mod-1")
  if (Math.abs(segments.completed - 24) > 0.1 || Math.abs(segments.missed - 36) > 0.1 || Math.abs(segments.remaining - 40) > 0.1) {
    console.error("CS101 segments expected completed 24, missed 36, remaining 40", segments)
    ;(globalThis as any).process.exit(1)
  }

  const year1Avg = state.getYearAverage("year-1")
  if (year1Avg === undefined || Math.abs(year1Avg - 56.5) > 0.2) {
    console.error(`Year 1 avg expected ~56.5, got ${year1Avg}`)
    ;(globalThis as any).process.exit(1)
  }

  // consistency check for required-per-assignment selector
  const desired = 70
  state.years.forEach((y) => {
    y.modules.forEach((m) => {
      const incomplete = m.assignments.filter((a) => !a.done)
      if (incomplete.length === 0) return
      const reqAvg = state.getRequiredModuleScoreForFinal(y.id, m.id, desired)
      const per = state.getRequiredPerAssignmentForModule(y.id, m.id, desired)
      if (reqAvg === undefined && per.length === 0) return
      if (reqAvg === undefined && per.some(p => p.feasible)) {
        console.error(`Inconsistent: module ${m.code} reported impossible but some per-assignment feasible`)
        ;(globalThis as any).process.exit(1)
      }
      if (reqAvg !== undefined) {
        // all returned `required` fields should equal the module average requirement
        per.forEach((p) => {
          if (Math.abs(p.required - reqAvg) > 0.1) {
            console.error(`Per-assignment required (${p.required}) differs from module required (${reqAvg})`)
            ;(globalThis as any).process.exit(1)
          }
          const R = m.assignments.reduce((s, a) => s + (a.done ? 0 : a.weight), 0)
          const a = m.assignments.find((aa) => aa.id === p.assignmentId)!
          const expectedSolo = Number((reqAvg * (R / a.weight)).toFixed(1))
          if (Math.abs(expectedSolo - p.soloRequired) > 0.1) {
            console.error(`Solo required mismatch for ${m.code}/${a.name}`)
            ;(globalThis as any).process.exit(1)
          }
        })
      }
    })
  })

  console.log("All checks passed for sample data, incomplete-assignments behavior, and per-assignment targets")
}
