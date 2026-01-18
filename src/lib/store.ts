import { nanoid } from "nanoid"
import { create } from "zustand"
import type { Assignment, GradeSnapshot, Module, Year, SubTask } from "./types"

function sum(arr: number[]) {
  return arr.reduce((s, v) => s + v, 0)
}

function clampPercent(n: number) {
  return Math.max(0, Math.min(100, n))
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
  getFinalGrade: () => number | undefined

  // desired final grade helpers
  setDesiredGrade: (grade?: number) => void
  getRequiredModuleScoreForFinal: (yearId: string, moduleId: string, desired: number) => number | undefined
  getRequiredPerAssignmentForModule: (yearId: string, moduleId: string, desired: number) => Array<{ assignmentId: string; required: number; soloRequired: number; feasible: boolean }>
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
    if (remainderWeight <= 0) return undefined

    const completedContrib = module.assignments.reduce((s, a) => s + ((a.score ?? 0) * (a.weight / 100) * (a.done ? 1 : 0)), 0)

    const yearLocal = year

    function finalIfX(x: number) {
      // compute module avg if remaining assignments avg = x
      const moduleAvg = completedContrib + (x * (remainderWeight / 100))
      const yearIdLocal = yearLocal.id
      // year average
      const modulesWithAvg = yearLocal.modules.map((m) => ({ avg: m.id === moduleId ? moduleAvg : state.getModuleAverage(yearIdLocal, m.id), credits: m.credits }))
      const validMods = modulesWithAvg.filter((m) => m.avg !== undefined)
      const totalCredits = validMods.reduce((s, m) => s + m.credits, 0)
      if (totalCredits === 0) return undefined
      const yearAvg = validMods.reduce((s, m) => s + (m.avg! * m.credits), 0) / totalCredits
      // final grade using other years unchanged
      const yearsWithAvg = state.years.map((y) => ({ avg: y.id === yearIdLocal ? yearAvg : state.getYearAverage(y.id), weight: y.weight }))
      const validYears = yearsWithAvg.filter((y) => y.avg !== undefined)
      const totalWeight = validYears.reduce((s, y) => s + y.weight, 0)
      if (totalWeight === 0) return undefined
      const normalized = validYears.map((y) => ({ avg: y.avg!, weight: y.weight / totalWeight }))
      return normalized.reduce((s, y) => s + y.avg * y.weight, 0)
    }

    // binary search for minimal x in [0,100]
    let lo = 0
    let hi = 100
    const target = desired
    if ((finalIfX(100) ?? 0) < target) return undefined
    for (let i=0;i<20;i++){
      const mid = (lo+hi)/2
      const f = finalIfX(mid)!
      if (f >= target) hi = mid
      else lo = mid
    }
    return Number(hi.toFixed(1))
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
