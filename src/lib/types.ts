export type ID = string

export type SubTask = {
  id: ID
  name: string
  weight: number // percentage of the assignment (0..100)
  score?: number
  done?: boolean
}

export type Assignment = {
  id: ID
  name: string
  weight: number // percentage (0..100)
  score?: number // 0..100, undefined when not graded yet
  done?: boolean // whether assignment is marked complete
  subTasks?: SubTask[]
}

export type Module = {
  id: ID
  code: string
  name?: string
  credits: number
  assignments: Assignment[]
}

export type Year = {
  id: ID
  name: string
  weight: number // contribution of this year to final degree (e.g., 0.2 for 20%)
  modules: Module[]
}

export type GradeSnapshot = {
  years: Year[]
  activeYearId?: ID
  desiredGrade?: number
}

export type DegreeClass = "First" | "2:1" | "2:2" | "Third" | "Fail"

export type OldClassificationResult = {
  gradeProfile: number[]
  baseUnit: number          // 10 or 5
  weightedAverage: number
  // Stage 2
  prelim1Class: DegreeClass
  // Stage 3
  midRank: number           // e.g. 18 or 36 (1-based)
  checkRank: number         // e.g. 15 or 30 (1-based)
  midGrade: number
  checkGrade: number
  prelim2Class: DegreeClass
  prelim2IsBorderline: boolean  // true when 15th/30th is in a higher class than 18th/36th
  // Stage 4
  scenario: 1 | 2 | 3
  finalClass: DegreeClass | null    // null when exam board required
  needsExamBoard: boolean
  examBoardGrade: number | undefined
  examBoardRecommendation: DegreeClass | undefined
}
