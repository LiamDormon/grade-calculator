import React from "react"
import type { Assignment } from "../lib/types"
import { useGradeStore } from "../lib/store"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Trash2 } from "lucide-react"

export default function AssignmentRow({ yearId, moduleId, assignment, showLabels = false }: { yearId: string; moduleId: string; assignment: Assignment; showLabels?: boolean }) {
  const updateAssignment = useGradeStore((s) => s.updateAssignment)
  const removeAssignment = useGradeStore((s) => s.removeAssignment)
  const desired = useGradeStore((s) => s.desiredGrade)
  const getRequiredPerAssignmentForModule = useGradeStore((s) => s.getRequiredPerAssignmentForModule)

  // show header labels only for the first row in the module
  if (showLabels) {
    return (
      <div className="mb-2">
        <div className="grid grid-cols-[2.5rem_1fr_4.5rem_9rem_2rem] gap-2 items-center pb-1">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Done</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Assignment</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Weight %</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>

        {/* first-row input controls (kept slightly roomier) */}
        <div className="grid grid-cols-[2.5rem_1fr_4.5rem_9rem_2rem] gap-2 items-center">
          <div className="flex items-center">
            <Checkbox checked={assignment.done} aria-label="mark assignment done" onCheckedChange={(v) => updateAssignment(yearId, moduleId, assignment.id, { done: !!v })} />
          </div>

          <Input className="h-8 text-sm" value={assignment.name} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { name: e.target.value })} />

          <Input className="w-full h-8 text-sm" type="number" value={String(assignment.weight)} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { weight: Number(e.target.value) })} />

          {(() => {
            const targets = (!assignment.done && desired !== undefined) ? getRequiredPerAssignmentForModule(yearId, moduleId, desired!) : []
            const t = targets.find((x) => x.assignmentId === assignment.id)
            
            return (
              <div className="w-full flex items-center gap-2">
                <Input 
                  className="w-20 h-8 text-sm shrink-0" 
                  type="number" 
                  value={assignment.score ?? ""} 
                  onChange={(e) => {
                    const v = e.target.value === "" ? undefined : Number(e.target.value)
                    updateAssignment(yearId, moduleId, assignment.id, { score: v })
                  }} 
                  placeholder="-" 
                />

                {t && (
                  <div 
                    className={`text-[10px] uppercase font-bold leading-tight ${t.soloRequired > 100 ? "text-destructive" : "text-muted-foreground"}`}
                    title={`Need ${t.required}%. Solo: ${t.soloRequired}%`}
                  >
                     Need<br/>{t.required}%
                  </div>
                )}
              </div>
            )
          })()}

          <div className="flex items-center justify-end">
            <Button size="icon" variant="reverse" className="h-8 w-8 p-0 bg-chart-4" aria-label="Delete assignment" title="Delete assignment" onClick={() => removeAssignment(yearId, moduleId, assignment.id)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // subsequent rows: compact inputs without labels
  return (
    <div className="py-1 border-t border-border/10">
      <div className="grid grid-cols-[2.5rem_1fr_4.5rem_9rem_2rem] gap-2 items-center">
        <div className="flex items-center">
          <Checkbox checked={assignment.done} aria-label="mark assignment done" onCheckedChange={(v) => updateAssignment(yearId, moduleId, assignment.id, { done: !!v })} />
        </div>

        <Input className="h-8 text-sm" value={assignment.name} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { name: e.target.value })} />
        <Input className="w-full h-8 text-sm" type="number" value={String(assignment.weight)} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { weight: Number(e.target.value) })} />
        {(() => {
          const targets = (!assignment.done && desired !== undefined) ? getRequiredPerAssignmentForModule(yearId, moduleId, desired!) : []
          const t = targets.find((x) => x.assignmentId === assignment.id)
          
          return (
            <div className="w-full flex items-center gap-2">
              <Input 
                className="w-20 h-8 text-sm shrink-0" 
                type="number" 
                value={assignment.score ?? ""} 
                onChange={(e) => {
                  const v = e.target.value === "" ? undefined : Number(e.target.value)
                  updateAssignment(yearId, moduleId, assignment.id, { score: v })
                }} 
                placeholder="-" 
              />

              {t && (
                <div 
                   className={`text-[10px] uppercase font-bold leading-tight ${t.soloRequired > 100 ? "text-destructive" : "text-muted-foreground"}`}
                   title={`Need ${t.required}%. Solo: ${t.soloRequired}%`}
                >
                  Need<br/>{t.required}%
                </div>
              )}
            </div>
          )
        })()} 
        <div className="flex items-center justify-end">
          <Button size="icon" variant="reverse" className="h-8 w-8 p-0 bg-chart-4" aria-label="Delete assignment" title="Delete assignment" onClick={() => removeAssignment(yearId, moduleId, assignment.id)}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  )
}
