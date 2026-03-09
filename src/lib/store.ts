import { nanoid } from "nanoid"
import { create } from "zustand"
import type { Assignment, DegreeClass, GradeSnapshot, Module, OldClassificationResult, Year, SubTask } from "./types"

function sum(arr: number[]) {
  return arr.reduce((s, v) => s + v, 0)
}

function clampPercent(n: number) {
  return Math.max(0, Math.min(100, n))
}

// ── Old-style degree classification helpers ───────────────────────────────────

const CLASS_RANKS: Record<DegreeClass, number> = { First: 4, "2:1": 3, "2:2": 2, Third: 1, Fail: 0 }

// Table 1: used for the weighted average (Stage 2)
function classifyTable1(n: number): DegreeClass {
  if (n >= 68) return "First"
  if (n >= 59.5) return "2:1"
  if (n >= 49.5) return "2:2"
  if (n >= 39.5) return "Third"
  return "Fail"
}

// Table 2: used for individual ranked grades (Stage 3) and exam-board average
function classifyTable2(n: number): DegreeClass {
  if (n >= 69.5) return "First"
  if (n >= 59.5) return "2:1"
  if (n >= 49.5) return "2:2"
  if (n >= 39.5) return "Third"
  return "Fail"
}

function recalculateAssignment(a: Assignment): Assignment {
  if (!a.subTasks || a.subTasks.length === 0) return a
  
  let weightedScoreSum = 0
  let allDone = true
  
  for (const t of a.subTasks) {
    if (!t.done) {
      allDone = false
    }
    if (t.score !== undefined) {
      weightedScoreSum += t.score * t.weight
    }
  }

  // Score is sum of (score * weight%). 
  const newScore = weightedScoreSum / 100
  
  return {
    ...a,
    score: Number(newScore.toFixed(2)),
    done: allDone && a.subTasks.length > 0
  }
}

export const sample: GradeSnapshot = {
  years: [
    {
      id: "year-1",
      name: "Year 1",
      weight: 0.2,
      modules: [
        {
          id: "mod-1",
          code: "CS101",
          name: "Intro to Programming",
          credits: 20,
          assignments: [
            // Exam is completed
            { id: "a-1", name: "Exam", weight: 60, score: 75, done: true },
            // Coursework is incomplete and should NOT count towards module average
            { id: "a-2", name: "Coursework", weight: 40, done: false }
          ]
        },
        {
          id: "mod-2",
          code: "MA101",
          name: "Calculus",
          credits: 20,
          assignments: [
            { id: "a-3", name: "Exam", weight: 100, score: 68 }
          ]
        }
      ]
    },
    {
      id: "year-2",
      name: "Year 2",
      weight: 0.8,
      modules: [
        {
          id: "mod-3",
          code: "CS201",
          name: "Data Structures",
          credits: 20,
          assignments: [
            { id: "a-4", name: "Exam", weight: 70, score: 78, done: true },
            // Project is ongoing
            { id: "a-5", name: "Project", weight: 30, done: false }
          ]
        }
      ]
    }
  ]
}

// Try to read persisted state from localStorage on load (if present)
const STORAGE_KEY = "grade-calculator:state"

function loadPersisted(): GradeSnapshot | undefined {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    // basic validation
    if (!parsed || !Array.isArray(parsed.years)) return undefined
    return parsed as GradeSnapshot
  } catch {
    return undefined
  }
}

const persisted = loadPersisted()
const initialState = persisted ?? sample

export type Actions = {
  // Years
  addYear: (name: string, weight?: number) => string
  updateYear: (id: string, patch: Partial<Year>) => void
  removeYear: (id: string) => void
  setActiveYear: (id?: string) => void

  // Modules
  addModule: (yearId: string, module: Partial<Module>) => string
  updateModule: (yearId: string, moduleId: string, patch: Partial<Module>) => void
  removeModule: (yearId: string, moduleId: string) => void
  reorderModules: (yearId: string, activeId: string, overId: string) => void

  // Assignments
  addAssignment: (
    yearId: string,
    moduleId: string,
    assignment: Partial<Assignment>
  ) => string
  updateAssignment: (
    yearId: string,
    moduleId: string,
    assignmentId: string,
    patch: Partial<Assignment>
  ) => void
  removeAssignment: (yearId: string, moduleId: string, assignmentId: string) => void

  // SubTasks
  addSubTask: (yearId: string, moduleId: string, assignmentId: string, subTask: Partial<SubTask>) => void
  updateSubTask: (yearId: string, moduleId: string, assignmentId: string, subTaskId: string, patch: Partial<SubTask>) => void
  removeSubTask: (yearId: string, moduleId: string, assignmentId: string, subTaskId: string) => void

  // validation helpers
  isModuleAssignmentsValid: (yearId: string, moduleId: string) => boolean

  // selectors
  getModuleAverage: (yearId: string, moduleId: string) => number | undefined
  getModuleCompletionPercent: (yearId: string, moduleId: string) => number
  getModuleAchievedScore: (yearId: string, moduleId: string) => number | undefined
  getModuleSegments: (yearId: string, moduleId: string) => { completed: number; missed: number; remaining: number }
  getYearSegments: (yearId: string) => { completed: number; missed: number; remaining: number }
  getYearAverage: (yearId: string) => number | undefined
  getYearAchievedAverage: (yearId: string) => number | undefined
  getFinalGrade: () => number | undefined
  getFinalAchievedGrade: () => number | undefined

  // old-style 4-stage classification
  getOldClassification: () => OldClassificationResult | null

  // desired final grade helpers
  setDesiredGrade: (grade?: number) => void
  getRequiredModuleScoreForFinal: (yearId: string, moduleId: string, desired: number) => number | undefined
  getRequiredPerAssignmentForModule: (yearId: string, moduleId: string, desired: number) => Array<{ assignmentId: string; required: number; soloRequired: number; feasible: boolean }>

  // import/export
  importState: (data: GradeSnapshot) => void
}

type Store = GradeSnapshot & Actions

export const useGradeStore = create<GradeSnapshot & Actions>()((set: (updater: (s: Store) => Partial<Store> | Store) => void, get: () => Store) => ({
  ...initialState,

  addYear: (name, weight = 0) => {
    const id = nanoid()
    set((state: Store) => ({ years: [...state.years, { id, name, weight, modules: [] }] }))
    return id
  },

  updateYear: (id, patch) => {
    set((state: Store) => ({
      years: state.years.map((y) => (y.id === id ? { ...y, ...patch } : y))
    }))
  },

  removeYear: (id) => {
    set((state: Store) => ({ years: state.years.filter((y) => y.id !== id) }))
  },

  setActiveYear: (id) => set(() => ({ activeYearId: id })),

  addModule: (yearId, module) => {
    const id = nanoid()
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? { ...y, modules: [...y.modules, { id, code: module.code ?? "", name: module.name, credits: module.credits ?? 20, assignments: module.assignments ?? [] }] }
          : y
      )
    }))
    return id
  },

  updateModule: (yearId, moduleId, patch) => {
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? { ...y, modules: y.modules.map((m) => (m.id === moduleId ? { ...m, ...patch } : m)) }
          : y
      )
    }))
  },

  removeModule: (yearId, moduleId) => {
    set((state: Store) => ({
      years: state.years.map((y) => (y.id === yearId ? { ...y, modules: y.modules.filter((m) => m.id !== moduleId) } : y))
    }))
  },

  reorderModules: (yearId, activeId, overId) => {
    set((state: Store) => {
      const yearIndex = state.years.findIndex((y) => y.id === yearId)
      if (yearIndex === -1) return state

      const year = state.years[yearIndex]
      const oldIndex = year.modules.findIndex((m) => m.id === activeId)
      const newIndex = year.modules.findIndex((m) => m.id === overId)

      if (oldIndex === -1 || newIndex === -1) return state

      const newModules = [...year.modules]
      const [movedModule] = newModules.splice(oldIndex, 1)
      newModules.splice(newIndex, 0, movedModule)

      const newYears = [...state.years]
      newYears[yearIndex] = { ...year, modules: newModules }

      return { years: newYears }
    })
  },

  addAssignment: (yearId, moduleId, assignment) => {
    const id = nanoid()
    const done = assignment.done !== undefined ? assignment.done : assignment.score !== undefined
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? {
              ...y,
              modules: y.modules.map((m) =>
                m.id === moduleId
                  ? { ...m, assignments: [...m.assignments, { id, name: assignment.name ?? "", weight: clampPercent(assignment.weight ?? 0), score: assignment.score, done }] }
                  : m
              )
            }
          : y
      )
    }))
    return id
  },

  updateAssignment: (yearId, moduleId, assignmentId, patch) => {
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? {
              ...y,
              modules: y.modules.map((m) =>
                m.id === moduleId
                  ? { ...m, assignments: m.assignments.map((a) => (a.id === assignmentId ? { ...a, ...patch, weight: patch.weight !== undefined ? clampPercent(patch.weight) : a.weight } : a)) }
                  : m
              )
            }
          : y
      )
    }))
  },

  removeAssignment: (yearId, moduleId, assignmentId) => {
    set((state: Store) => ({
      years: state.years.map((y) => y.id === yearId ? { ...y, modules: y.modules.map((m) => (m.id === moduleId ? { ...m, assignments: m.assignments.filter((a) => a.id !== assignmentId) } : m)) } : y)
    }))
  },

  addSubTask: (yearId, moduleId, assignmentId, subTask) => {
    const id = nanoid()
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? {
              ...y,
              modules: y.modules.map((m) =>
                m.id === moduleId
                  ? {
                      ...m,
                      assignments: m.assignments.map((a) => {
                        if (a.id === assignmentId) {
                          const newSubTasks = [...(a.subTasks || []), { id, name: subTask.name ?? "", weight: clampPercent(subTask.weight ?? 0), score: subTask.score, done: !!subTask.done }]
                          return recalculateAssignment({ ...a, subTasks: newSubTasks })
                        }
                        return a
                      })
                    }
                  : m
              )
            }
          : y
      )
    }))
  },

  updateSubTask: (yearId, moduleId, assignmentId, subTaskId, patch) => {
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? {
              ...y,
              modules: y.modules.map((m) =>
                m.id === moduleId
                  ? {
                      ...m,
                      assignments: m.assignments.map((a) => {
                        if (a.id === assignmentId && a.subTasks) {
                          const newSubTasks = a.subTasks.map((t) => (t.id === subTaskId ? { ...t, ...patch, weight: patch.weight !== undefined ? clampPercent(patch.weight) : t.weight } : t))
                          return recalculateAssignment({ ...a, subTasks: newSubTasks })
                        }
                        return a
                      })
                    }
                  : m
              )
            }
          : y
      )
    }))
  },

  removeSubTask: (yearId, moduleId, assignmentId, subTaskId) => {
    set((state: Store) => ({
      years: state.years.map((y) =>
        y.id === yearId
          ? {
              ...y,
              modules: y.modules.map((m) =>
                m.id === moduleId
                  ? {
                      ...m,
                      assignments: m.assignments.map((a) => {
                        if (a.id === assignmentId && a.subTasks) {
                          const newSubTasks = a.subTasks.filter((t) => t.id !== subTaskId)
                          return recalculateAssignment({ ...a, subTasks: newSubTasks })
                        }
                        return a
                      })
                    }
                  : m
              )
            }
          : y
      )
    }))
  },

  setDesiredGrade: (grade) => set(() => ({ desiredGrade: grade })),


  getRequiredModuleScoreForFinal: (yearId, moduleId, desired) => {
    const state = get()
    const year = state.years.find((y) => y.id === yearId)
    if (!year) return undefined
    const module = year.modules.find((m) => m.id === moduleId)
    if (!module) return undefined

    const remainderWeight = module.assignments.reduce((s, a) => s + (a.done ? 0 : a.weight), 0)
    if (remainderWeight <= 0.001) return undefined

    // Global calculation: Find x such that if ALL incomplete assignments (in all modules) get x, we hit desired.
    function calculateFinalGradeWithRemainingX(x: number): number {
      const yearValues = state.years.map((y) => {
         const moduleValues = y.modules.map((m) => {
            let totalWeight = 0
            let totalScore = 0
            m.assignments.forEach((a) => {
               totalWeight += a.weight
               if (a.done) {
                  if (typeof a.score === "number") {
                     totalScore += a.score * (a.weight / 100)
                  }
               } else {
                  // Not done: use x for remaining parts
                  let effectiveX = x
                  if (a.subTasks && a.subTasks.length > 0) {
                     const stW = a.subTasks.reduce((s, t) => s + t.weight, 0)
                     if (stW > 0) {
                        const scoreSum = a.subTasks.reduce((acc, t) => {
                           const val = (t.done && typeof t.score === "number") ? t.score : x
                           return acc + val * (t.weight / 100) 
                        }, 0)
                        effectiveX = scoreSum / (stW / 100)
                     }
                  }
                  totalScore += effectiveX * (a.weight / 100)
               }
            })
            
            if (totalWeight <= 0.001) return undefined
            const avg = totalScore / (totalWeight / 100)
            return { avg, credits: m.credits }
         })
         
         const validModules = moduleValues.filter((v): v is { avg: number; credits: number } => v !== undefined)
         const totalCredits = validModules.reduce((s, m) => s + m.credits, 0)
         if (totalCredits === 0) return undefined
         
         const yearAvg = validModules.reduce((s, m) => s + m.avg * m.credits, 0) / totalCredits
         return { avg: yearAvg, weight: y.weight }
      })

      const validYears = yearValues.filter((v): v is { avg: number; weight: number } => v !== undefined)
      const totalWeight = validYears.reduce((s, y) => s + y.weight, 0)
      if (totalWeight === 0) return 0
      
      return validYears.reduce((s, y) => s + y.avg * (y.weight / totalWeight), 0)
    }

    // Check bounds
    const maxGrade = calculateFinalGradeWithRemainingX(100)
    if (maxGrade < desired) return undefined

    const currentGrade = calculateFinalGradeWithRemainingX(0)
    if (currentGrade >= desired) return 0

    if (maxGrade - currentGrade < 0.0001) return undefined
    
    // Linear interpolation
    const req = 100 * (desired - currentGrade) / (maxGrade - currentGrade)
    return Number(req.toFixed(1))
  },

  // per-assignment required targets: returns required average for each remaining assignment (same for all) and
  // the 'solo' required value if that one assignment must cover the whole gap (may be >100)
  getRequiredPerAssignmentForModule: (yearId, moduleId, desired) => {
    const state = get()
    const year = state.years.find((y) => y.id === yearId)
    if (!year) return []
    const module = year.modules.find((m) => m.id === moduleId)
    if (!module) return []

    const remainderWeight = module.assignments.reduce((s, a) => s + (a.done ? 0 : a.weight), 0)
    if (remainderWeight <= 0) return []

    const x = state.getRequiredModuleScoreForFinal(yearId, moduleId, desired)
    if (x === undefined) {
      // not possible to hit desired even if perfect scores
      return module.assignments.filter((a) => !a.done).map((a) => ({ assignmentId: a.id, required: Infinity, soloRequired: Infinity, feasible: false }))
    }

    return module.assignments.filter((a) => !a.done).map((a) => {
      const required = Number(x.toFixed(1))
      const soloRequired = Number((x * (remainderWeight / a.weight)).toFixed(1))
      const feasible = soloRequired <= 100
      return { assignmentId: a.id, required, soloRequired, feasible }
    })
  },

  isModuleAssignmentsValid: (yearId, moduleId) => {
    const y = get().years.find((y) => y.id === yearId)
    const m = y?.modules.find((m) => m.id === moduleId)
    if (!m) return false
    return Math.abs(sum(m.assignments.map((a) => a.weight)) - 100) < 0.0001
  },

  getModuleAverage: (yearId, moduleId) => {
    const y = get().years.find((y) => y.id === yearId)
    const m = y?.modules.find((m) => m.id === moduleId)
    if (!m) return undefined
    
    let totalWeight = 0
    let totalScore = 0

    m.assignments.forEach((a) => {
      if (a.done && typeof a.score === "number") {
        totalWeight += a.weight
        totalScore += a.score * (a.weight / 100)
      }
    })

    if (totalWeight === 0) return undefined
    
    // Normalize to 0-100 scale based on completed weight
    const average = (totalScore / (totalWeight / 100))
    return Number(average.toFixed(2))
  },

  getModuleCompletionPercent: (yearId, moduleId) => {
    const y = get().years.find((y) => y.id === yearId)
    const m = y?.modules.find((m) => m.id === moduleId)
    if (!m) return 0
    const done = m.assignments.reduce((s, a) => s + (a.done ? a.weight : 0), 0)
    return Math.round(done)
  },

  getModuleAchievedScore: (yearId, moduleId) => {
    const y = get().years.find((y) => y.id === yearId)
    const m = y?.modules.find((m) => m.id === moduleId)
    if (!m) return undefined
    const total = m.assignments.reduce((acc, a) => {
      if (a.done && typeof a.score === "number") return acc + a.score * (a.weight / 100)
      return acc
    }, 0)
    return Number(total.toFixed(2))
  },

  getModuleSegments: (yearId: string, moduleId: string) => {
    const y = get().years.find((y) => y.id === yearId)
    const m = y?.modules.find((m) => m.id === moduleId)
    if (!m) return { completed: 0, missed: 0, remaining: 0 }

    let completed = 0
    let missed = 0
    let remaining = 0

    m.assignments.forEach((a) => {
      const w = a.weight
      if (!a.done) {
        remaining += w
      } else {
        const score = typeof a.score === "number" ? a.score : 0
        const achieved = (score / 100) * w
        const miss = w - achieved
        completed += achieved
        missed += miss
      }
    })

    // ensure rounding to 1 decimal and that totals sum to 100 (fix small fp errors)
    const total = completed + missed + remaining
    if (total === 0) return { completed: 0, missed: 0, remaining: 0 }
    const scale = 100 / total
    return {
      completed: Number((completed * scale).toFixed(1)),
      missed: Number((missed * scale).toFixed(1)),
      remaining: Number((remaining * scale).toFixed(1))
    }
  },

  getYearAverage: (yearId) => {
    const y = get().years.find((y) => y.id === yearId)
    if (!y) return undefined
    const modulesWithAvg = y.modules.map((m) => ({ avg: get().getModuleAverage(yearId, m.id), credits: m.credits }))
    const valid = modulesWithAvg.filter((m) => m.avg !== undefined)
    const totalCredits = valid.reduce((s, m) => s + m.credits, 0)
    if (totalCredits === 0) return undefined
    const weighted = valid.reduce((s, m) => s + (m.avg! * m.credits), 0) / totalCredits
    return Number(weighted.toFixed(2))
  },

  getYearAchievedAverage: (yearId) => {
    const y = get().years.find((y) => y.id === yearId)
    if (!y) return undefined
    const totalCredits = y.modules.reduce((s, m) => s + m.credits, 0)
    if (totalCredits === 0) return 0
    
    // Sum of (moduleAchieved * credits)
    const weightedSum = y.modules.reduce((s, m) => {
       const modScore = get().getModuleAchievedScore(yearId, m.id) ?? 0
       return s + (modScore * m.credits)
    }, 0)
    
    // Average over total credits (including empty modules)
    return Number((weightedSum / totalCredits).toFixed(2))
  },

  getYearSegments: (yearId: string) => {
    const state = get()
    const y = state.years.find((yy) => yy.id === yearId)
    if (!y) return { completed: 0, missed: 0, remaining: 0 }
    const totalCredits = y.modules.reduce((s, m) => s + m.credits, 0)
    if (totalCredits === 0) return { completed: 0, missed: 0, remaining: 0 }

    let completedCredits = 0
    let missedCredits = 0
    let remainingCredits = 0

    y.modules.forEach((m) => {
      const seg = state.getModuleSegments(yearId, m.id)
      // seg.* are percentages of the module (sum=100)
      completedCredits += (seg.completed / 100) * m.credits
      missedCredits += (seg.missed / 100) * m.credits
      remainingCredits += (seg.remaining / 100) * m.credits
    })

    const total = completedCredits + missedCredits + remainingCredits
    if (total === 0) return { completed: 0, missed: 0, remaining: 0 }
    const scale = 100 / total
    return {
      completed: Number((completedCredits * scale).toFixed(1)),
      missed: Number((missedCredits * scale).toFixed(1)),
      remaining: Number((remainingCredits * scale).toFixed(1))
    }
  },

  getFinalAchievedGrade: () => {
    const state = get()
    // Calculate for all years, treating undefined as 0 if the year exists
    const totalWeight = state.years.reduce((s, y) => s + y.weight, 0)
    if (totalWeight === 0) return 0
    
    const weightedSum = state.years.reduce((s, y) => {
       const yearScore = state.getYearAchievedAverage(y.id) ?? 0
       return s + (yearScore * y.weight)
    }, 0)
    
    // Normalize by total weight defined in system (should be 1 usually, but normalize to be safe if > 0)
    return Number((weightedSum / totalWeight).toFixed(2))
  },

  getFinalGrade: () => {
    const state = get()
    const yearsWithAvg = state.years.map((y) => ({ avg: state.getYearAverage(y.id), weight: y.weight }))
    const valid = yearsWithAvg.filter((y) => y.avg !== undefined)
    const totalWeight = valid.reduce((s, y) => s + y.weight, 0)
    if (totalWeight === 0) return undefined
    // normalize weights if they don't sum to 1
    const normalized = valid.map((y) => ({ avg: y.avg!, weight: y.weight / totalWeight }))
    const final = normalized.reduce((s, y) => s + y.avg * y.weight, 0)
    return Number(final.toFixed(2))
  },

  getOldClassification: (): OldClassificationResult | null => {
    const state = get()
    const years = state.years

    // Year 1 (index 0) does not count
    const countingYears = years.slice(1)
    if (countingYears.length === 0) return null

    // Determine base unit: 5 if any module has credits that are a multiple of 5 but not 10
    const allModules = countingYears.flatMap((y) => y.modules)
    const hasBase5 = allModules.some((m) => m.credits % 10 !== 0 && m.credits % 5 === 0)
    const baseUnit = hasBase5 ? 5 : 10

    // Level 2 = all counting years except the last; Level 3 = the last counting year
    const level2Years = countingYears.slice(0, -1)
    const level3Year = countingYears[countingYears.length - 1]

    // Build grade profile
    const gradeProfile: number[] = []

    for (const year of level2Years) {
      for (const module of year.modules) {
        const grade = state.getModuleAverage(year.id, module.id)
        if (grade === undefined) continue
        const elements = Math.round(module.credits / baseUnit) // e.g. 20-credit → 2 elements of 10
        for (let i = 0; i < elements; i++) gradeProfile.push(grade)
      }
    }

    for (const module of level3Year.modules) {
      const grade = state.getModuleAverage(level3Year.id, module.id)
      if (grade === undefined) continue
      // Level 3 modules are counted twice (weighted 2×)
      const elements = Math.round(module.credits / baseUnit) * 2
      for (let i = 0; i < elements; i++) gradeProfile.push(grade)
    }

    if (gradeProfile.length === 0) return null

    const n = gradeProfile.length

    // ── Stage 2: Weighted average → Preliminary Classification 1 ─────────────
    const weightedAverage = Number((gradeProfile.reduce((s, g) => s + g, 0) / n).toFixed(2))
    const prelim1Class = classifyTable1(weightedAverage)

    // ── Stage 3: Distribution → Preliminary Classification 2 ─────────────────
    // Rank grades highest → lowest
    const sorted = [...gradeProfile].sort((a, b) => b - a)

    // mid = n/2 (1-based); check = n/2 - n/12 (1-based)
    const midRank = Math.floor(n / 2)
    const checkRank = midRank - Math.floor(n / 12)
    const midGrade = sorted[midRank - 1]     // convert to 0-based index
    const checkGrade = sorted[checkRank - 1]

    const midClass = classifyTable2(midGrade)
    const checkClass = classifyTable2(checkGrade)
    const prelim2IsBorderline = CLASS_RANKS[checkClass] > CLASS_RANKS[midClass]
    const prelim2Class = midClass

    // ── Stage 4: Determine final classification ────────────────────────────────
    const r1 = CLASS_RANKS[prelim1Class]
    const r2 = CLASS_RANKS[prelim2Class]

    let scenario: 1 | 2 | 3
    let finalClass: DegreeClass | null = null
    let needsExamBoard = false

    if (!prelim2IsBorderline) {
      if (r1 === r2) {
        scenario = 1
        finalClass = prelim1Class
      } else {
        scenario = 3
        needsExamBoard = true
      }
    } else {
      // prelim2 is borderline upward: range covers r2 and r2+1
      const r2High = r2 + 1
      if (r1 === r2 || r1 === r2High) {
        // Scenario 2: prelim1 class sits within the borderline range → award prelim1
        scenario = 2
        finalClass = prelim1Class
      } else {
        scenario = 3
        needsExamBoard = true
      }
    }

    // Exam board recommendation: credit-weighted average of the final year, classified via Table 2
    let examBoardGrade: number | undefined
    let examBoardRecommendation: DegreeClass | undefined
    if (needsExamBoard) {
      const finalYearModules = level3Year.modules.map((m) => ({
        grade: state.getModuleAverage(level3Year.id, m.id),
        credits: m.credits,
      }))
      const valid = finalYearModules.filter((m) => m.grade !== undefined)
      if (valid.length > 0) {
        const totalCredits = valid.reduce((s, m) => s + m.credits, 0)
        const creditWeightedAvg = valid.reduce((s, m) => s + m.grade! * m.credits, 0) / totalCredits
        examBoardGrade = Number(creditWeightedAvg.toFixed(2))
        examBoardRecommendation = classifyTable2(examBoardGrade)
      }
    }

    return {
      gradeProfile,
      baseUnit,
      weightedAverage,
      prelim1Class,
      midRank,
      checkRank,
      midGrade,
      checkGrade,
      prelim2Class,
      prelim2IsBorderline,
      scenario,
      finalClass,
      needsExamBoard,
      examBoardGrade,
      examBoardRecommendation,
    }
  },

  importState: (data: GradeSnapshot) => {
    // Basic validation
    if (!data || !Array.isArray(data.years)) {
      alert("Invalid grade data file")
      return
    }
    set(() => ({
      years: data.years,
      activeYearId: data.activeYearId,
      desiredGrade: data.desiredGrade
    }))
  }
} as GradeSnapshot & Actions))

// Persist store changes to localStorage
if (typeof window !== "undefined") {
  useGradeStore.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ years: state.years, activeYearId: state.activeYearId }))
    } catch {
      // ignore
    }
  })
}
