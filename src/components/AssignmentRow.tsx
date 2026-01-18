import type { Assignment } from "../lib/types"
import { useGradeStore } from "../lib/store"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Trash2, Plus, CornerDownRight } from "lucide-react"

export default function AssignmentRow({ yearId, moduleId, assignment, showLabels = false }: { yearId: string; moduleId: string; assignment: Assignment; showLabels?: boolean }) {
  const updateAssignment = useGradeStore((s) => s.updateAssignment)
  const removeAssignment = useGradeStore((s) => s.removeAssignment)
  const addSubTask = useGradeStore((s) => s.addSubTask)
  const updateSubTask = useGradeStore((s) => s.updateSubTask)
  const removeSubTask = useGradeStore((s) => s.removeSubTask)
  
  const desired = useGradeStore((s) => s.desiredGrade)
  const getRequiredPerAssignmentForModule = useGradeStore((s) => s.getRequiredPerAssignmentForModule)

  const hasSubTasks = assignment.subTasks && assignment.subTasks.length > 0
  
  // Common Grid Layout
  const gridClass = "grid grid-cols-[2.5rem_1fr_1fr_auto] md:grid-cols-[2.5rem_1fr_4.5rem_9rem_5rem] gap-2 items-end md:items-center"

  const targets = (!assignment.done && desired !== undefined) ? getRequiredPerAssignmentForModule(yearId, moduleId, desired!) : []
  const t = targets.find((x) => x.assignmentId === assignment.id)

  return (
    <div className="mb-2">
        {showLabels && (
            <div className={`${gridClass} pb-1 hidden md:grid`}>
                <div><div className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Done</div></div>
                <div><div className="text-xs text-foreground/50">Assignment</div></div>
                <div><div className="text-xs text-foreground/50">Weight %</div></div>
                <div><div className="text-xs text-foreground/50">Score</div></div>
                <div></div>
            </div>
        )}
        
        {/* Main Assignment Row */}
        <div className={`${gridClass} ${showLabels ? "" : "py-1 border-t border-border/10"}`}>
          <div className="flex items-center justify-center md:justify-start h-8 md:h-auto order-2 md:order-none">
             <Checkbox 
                checked={assignment.done} 
                className={hasSubTasks ? "opacity-50" : ""}
                disabled={hasSubTasks}
                aria-label="mark assignment done" 
                onCheckedChange={(v) => !hasSubTasks && updateAssignment(yearId, moduleId, assignment.id, { done: !!v })} 
             />
          </div>

          <Input className="h-8 text-sm order-1 md:order-none col-span-4 md:col-span-1" value={assignment.name} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { name: e.target.value })} placeholder="Assignment Name" />

          <div className="flex flex-col md:block order-3 md:order-none">
             <label className="text-[10px] text-foreground/50 md:hidden ml-1 mb-1">Weight %</label>
             <Input className="w-full h-8 text-sm" type="number" value={String(assignment.weight)} onChange={(e) => updateAssignment(yearId, moduleId, assignment.id, { weight: Number(e.target.value) })} placeholder="Weight %" />
          </div>

          <div className="w-full flex md:flex-row flex-col items-start md:items-center md:gap-2 order-4 md:order-none">
            <label className="text-[10px] text-foreground/50 md:hidden ml-1 mb-1">Score</label>
            <div className="flex items-center gap-2 w-full">
                <Input 
                className={`w-20 h-8 text-sm shrink-0 ${hasSubTasks ? "bg-black/5 text-foreground/50 cursor-not-allowed" : ""}`}
                type="number" 
                value={assignment.score ?? ""} 
                readOnly={hasSubTasks}
                onChange={(e) => {
                    if (hasSubTasks) return
                    const v = e.target.value === "" ? undefined : Number(e.target.value)
                    updateAssignment(yearId, moduleId, assignment.id, { score: v })
                }} 
                placeholder="Score" 
                />

                {!hasSubTasks && t && (
                <div 
                    className={`text-[10px] uppercase font-bold leading-tight ${t.soloRequired > 100 ? "text-chart-4" : "text-foreground/50"}`}
                    title={`Need ${t.required}%. Solo: ${t.soloRequired}%`}
                >
                    Need<br/>{t.required}%
                </div>
                )}
                
                {hasSubTasks && (
                    <div className="text-[10px] text-foreground/50 uppercase font-bold leading-tight min-w-[30px]" title="Calculated from subtasks">
                        Calc.<br/>Score
                    </div>
                )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 h-8 md:h-auto order-5 md:order-none">
            <Button size="icon" variant="reverse" className="h-8 w-8 p-0" aria-label="Add subtask" title="Add subtask" onClick={() => addSubTask(yearId, moduleId, assignment.id, { weight: 0 })}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="reverse" className="h-8 w-8 p-0 bg-destructive" aria-label="Delete assignment" title="Delete assignment" onClick={() => removeAssignment(yearId, moduleId, assignment.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Subtask Rows */}
        {assignment.subTasks?.map((subTask) => (
             <div key={subTask.id} className={`${gridClass} py-1 relative pl-4 md:pl-0 border-l-2 md:border-l-0 border-border/20 ml-1 md:ml-0 my-1 md:my-0`}>
                <div className="flex items-center justify-end md:justify-end gap-2 pr-1 h-7 md:h-auto order-2 md:order-none">
                    <CornerDownRight className="w-3 h-3 text-foreground/50 hidden md:block" />
                    <Checkbox 
                      checked={subTask.done} 
                      className="h-3 w-3"
                      aria-label="mark subtask done" 
                      onCheckedChange={(v) => updateSubTask(yearId, moduleId, assignment.id, subTask.id, { done: !!v })} 
                    />
                </div>
                
                <Input 
                    className="h-7 text-xs order-1 md:order-none col-span-4 md:col-span-1" 
                    value={subTask.name} 
                    onChange={(e) => updateSubTask(yearId, moduleId, assignment.id, subTask.id, { name: e.target.value })} 
                    placeholder="Subtask Name" 
                />
                
                <div className="relative order-3 md:order-none flex flex-col md:block">
                    <label className="text-[10px] text-foreground/50 md:hidden ml-1 mb-1">Weight %</label>
                    <Input 
                        className="w-full h-7 text-xs pr-4" 
                        type="number" 
                        value={String(subTask.weight)} 
                        onChange={(e) => updateSubTask(yearId, moduleId, assignment.id, subTask.id, { weight: Number(e.target.value) })} 
                        placeholder="Weight %"
                    />
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center md:gap-2 order-4 md:order-none">
                    <label className="text-[10px] text-foreground/50 md:hidden ml-1 mb-1">Score</label>
                    <Input 
                    className="w-20 h-7 text-xs shrink-0" 
                    type="number" 
                    value={subTask.score ?? ""} 
                    onChange={(e) => {
                        const v = e.target.value === "" ? undefined : Number(e.target.value)
                        updateSubTask(yearId, moduleId, assignment.id, subTask.id, { score: v })
                    }} 
                    placeholder="Score" 
                    />
                </div>

                <div className="flex items-center justify-end h-7 md:h-auto order-5 md:order-none">
                    <Button size="icon" variant="reverse" className="h-7 w-7 p-0 bg-destructive" aria-label="Delete subtask" onClick={() => removeSubTask(yearId, moduleId, assignment.id, subTask.id)}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        ))}
    </div>
  )
}
