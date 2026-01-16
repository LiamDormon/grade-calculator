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
      <div className="assignment-header">
        <div className="grid grid-cols-[2.5rem_1fr_4.5rem_6rem_2rem] gap-1 items-center">
          <div>
            <div className="text-xs text-muted">Done</div>
          </div>

          <div>
            <div className="text-xs text-muted">Assignment</div>
          </div>

          <div>
            <div className="text-xs text-muted">Weight %</div>
          </div>

          <div>
            <div className="text-xs text-muted">Score</div>
          </div>
        </div>

        {/* first-row input controls (kept slightly roomier) */}
        <div className="grid grid-cols-[2.5rem_1fr_4.5rem_6rem_2rem] gap-1 items-center">
          <div className="flex items-center">
            <Checkbox checked={assignment.done} aria-label="mark assignment done" onCheckedChange={(v) => updateAssignment(yearId, moduleId, assignment.id, { done: !!v })} />
          </div>

          <Input className="h-8 text-sm" value={assignment.name} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { name: e.target.value })} />

          <Input className="w-full h-8 text-sm" type="number" value={String(assignment.weight)} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { weight: Number(e.target.value) })} />

          {(() => {
          // compute targets once so we can conditionally add right padding only when suffix is present
          const targets = (!assignment.done && desired !== undefined) ? getRequiredPerAssignmentForModule(yearId, moduleId, desired!) : []
          const t = targets.find((x) => x.assignmentId === assignment.id)
          const inputClass = `w-full h-8 text-sm ${t ? "pr-10" : ""}`
          return (
            <div className="score-with-suffix w-full">
              <Input className={inputClass} type="number" value={assignment.score ?? ""} onChange={(e) => {
                const v = e.target.value === "" ? undefined : Number(e.target.value)
                updateAssignment(yearId, moduleId, assignment.id, { score: v })
              }} placeholder="score" />

              {t ? (
                <span
                  className={`score-suffix ${t.soloRequired > 100 ? "warn" : "ok"}`}
                  title={`Need ${t.required}%. Solo: ${t.soloRequired}%`}
                  aria-label={`Need ${t.required} percent; solo ${t.soloRequired} percent`}
                >
                  <strong>{t.required}%</strong>{t.soloRequired > 100 ? <span className="ml-1" aria-hidden>⚠</span> : null}
                </span>
              ) : null}
            </div>
          )
        })()}

          <div className="flex items-center justify-end">
            <Button size="icon" variant="neutral" className="h-8 w-8 p-0" aria-label="Delete assignment" title="Delete assignment" onClick={() => removeAssignment(yearId, moduleId, assignment.id)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // subsequent rows: compact inputs without labels
  return (
    <div className="assignment-row">
      <div className="grid grid-cols-[2.5rem_1fr_4.5rem_6rem_2rem] gap-1 items-center">
        <div className="flex items-center">
          <Checkbox checked={assignment.done} aria-label="mark assignment done" onCheckedChange={(v) => updateAssignment(yearId, moduleId, assignment.id, { done: !!v })} />
        </div>

        <Input className="h-8 text-sm" value={assignment.name} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { name: e.target.value })} />
        <Input className="w-full h-8 text-sm" type="number" value={String(assignment.weight)} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { weight: Number(e.target.value) })} />
        {(() => {
          const targets = (!assignment.done && desired !== undefined) ? getRequiredPerAssignmentForModule(yearId, moduleId, desired!) : []
          const t = targets.find((x) => x.assignmentId === assignment.id)
          const inputClass = `w-full h-8 text-sm ${t ? "pr-10" : ""}`
          return (
            <div className="score-with-suffix w-full">
              <Input className={inputClass} type="number" value={assignment.score ?? ""} onChange={(e) => {
                const v = e.target.value === "" ? undefined : Number(e.target.value)
                updateAssignment(yearId, moduleId, assignment.id, { score: v })
              }} placeholder="score" />

              {t ? (
                <span
                  className={`score-suffix ${t.soloRequired > 100 ? "warn" : "ok"}`}
                  title={`Need ${t.required}%. Solo: ${t.soloRequired}%`}
                  aria-label={`Need ${t.required} percent; solo ${t.soloRequired} percent`}
                >
                  <strong>{t.required}%</strong>{t.soloRequired > 100 ? <span className="ml-1" aria-hidden>⚠</span> : null}
                </span>
              ) : null}
            </div>
          )
        })()} 
        <div className="flex items-center justify-end">
          <Button size="icon" variant="neutral" className="h-8 w-8 p-0" aria-label="Delete assignment" title="Delete assignment" onClick={() => removeAssignment(yearId, moduleId, assignment.id)}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  )
}
