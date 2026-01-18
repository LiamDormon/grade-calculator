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
