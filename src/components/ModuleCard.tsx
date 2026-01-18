import React, { useState } from "react"
import type { Module as ModType } from "../lib/types"
import { useGradeStore } from "../lib/store"
import AssignmentRow from "./AssignmentRow"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import MultiProgress from "./ui/multiProgress"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Trash2, Plus, Pencil, Check } from "lucide-react"

export default function ModuleCard({ yearId, module }: { yearId: string; module: ModType }) {
  const addAssignment = useGradeStore((s) => s.addAssignment)
  const removeModule = useGradeStore((s) => s.removeModule)
  const updateModule = useGradeStore((s) => s.updateModule)
  const isValid = useGradeStore((s) => s.isModuleAssignmentsValid)

  const [aName, setAName] = useState("")
  const [aWeight, setAWeight] = useState(0)
  const [isEditingHeader, setIsEditingHeader] = useState(false)

  const getModuleSegments = useGradeStore((s) => s.getModuleSegments)
  const getRequiredModuleScoreForFinal = useGradeStore((s) => s.getRequiredModuleScoreForFinal)
  const desired = useGradeStore((s) => s.desiredGrade)
  const segments = getModuleSegments(yearId, module.id)

  const add = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!aName) return
    addAssignment(yearId, module.id, { name: aName, weight: aWeight })
    setAName("")
    setAWeight(0)
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          {isEditingHeader ? (
             <div className="flex flex-col gap-2 w-full max-w-md mr-4">
               <div className="flex gap-2">
                 <Input 
                   className="w-24 h-9 font-bold bg-secondary-background" 
                   value={module.code} 
                   onChange={(e) => updateModule(yearId, module.id, { code: e.target.value })} 
                   placeholder="Code" 
                 />
                 <Input 
                   className="flex-1 h-9 font-bold bg-secondary-background" 
                   value={module.name} 
                   onChange={(e) => updateModule(yearId, module.id, { name: e.target.value })} 
                   placeholder="Module Name" 
                 />
               </div>
               <div className="flex items-center gap-2">
                  <Input 
                    className="w-20 h-7 text-sm bg-secondary-background" 
                    type="number" 
                    value={String(module.credits)} 
                    onChange={(e) => updateModule(yearId, module.id, { credits: Number(e.target.value) })} 
                  />
                  <span className="text-sm text-muted-foreground">credits</span>
               </div>
             </div>
          ) : (
            <div>
              <div className="text-lg font-bold">{module.code} {module.name ? `— ${module.name}` : ""}</div>
              <div className="text-sm text-muted-foreground">{module.credits} credits</div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="icon" variant="neutral" className="h-8 w-8 p-0" aria-label="Edit module" title="Edit module details" onClick={() => setIsEditingHeader(!isEditingHeader)}>
              {isEditingHeader ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="neutral" className="h-8 w-8 p-0 bg-destructive" aria-label="Remove module" title="Remove module" onClick={() => removeModule(yearId, module.id)}>
              <Trash2 className="w-4 h-4 text-black" />
            </Button>
          </div>
        </div>

        <div className="py-2">
          <div className="mt-3">
            {/* multi-segment progress: completed (purple), missed (red), remaining (light) */}
            <div>
              <MultiProgress segments={[
                { value: segments.completed, color: "var(--chart-1)", title: `Achieved ${segments.completed}%` },
                { value: segments.missed, color: "var(--chart-4)", title: `Missed ${segments.missed}%` },
                { value: segments.remaining, color: "var(--secondary-background)", title: `Remaining ${segments.remaining}%` }
              ]} />

              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <div title={`Completed ${segments.completed}%`}><strong>Achieved</strong> {segments.completed}%</div>
                <div title={`Missed ${segments.missed}%`}><strong>Missed</strong> {segments.missed}%</div>
                <div title={`Remaining ${segments.remaining}%`}><strong>Remaining</strong> {segments.remaining}%</div>
              </div>

              {/* desired-grade hint: show required average on remaining assignments for this module */}
              {desired !== undefined && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {(() => {
                    const req = getRequiredModuleScoreForFinal(yearId, module.id, desired)
                    if (req === undefined) return <em>Target not possible for this module</em>
                    return <span>Target (remaining avg): <strong>{req}%</strong></span>
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {module.assignments.map((a, i) => (
          <AssignmentRow key={a.id} yearId={yearId} moduleId={module.id} assignment={a} showLabels={i === 0} />
        ))}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t-2 border-border/10 pt-4 mt-2">
        <form onSubmit={add} className="grid grid-cols-[2.5rem_1fr_4.5rem_9rem_2rem] gap-2 items-center w-full">
            <div className="flex justify-center">
                <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input 
                className="h-8 text-sm bg-secondary-background border-dashed hover:border-solid hover:border-border transition-colors" 
                placeholder="New assignment" 
                value={aName} 
                onChange={(e) => setAName(e.target.value)} 
            />
            <Input 
                className="h-8 text-sm bg-secondary-background border-dashed hover:border-solid hover:border-border transition-colors" 
                type="number" 
                placeholder="%"
                value={String(aWeight)} 
                onChange={(e) => setAWeight(parseFloat(e.target.value))} 
            />
             <div className="h-8 flex items-center justify-start pl-2 text-xs text-muted-foreground w-20">
               —
             </div>
            <Button type="submit" size="icon" className="h-8 w-8 p-0" variant="default" title="Add assignment"> <Plus className="w-4 h-4" /> </Button>
        </form>

        {!isValid(yearId, module.id) && (
          <div className={`text-sm w-full text-center py-2 rounded-base border-2 font-bold mt-2 ${isValid(yearId, module.id) ? "border-green-800 bg-green-200 text-green-900" : "border-red-500 bg-red-200 text-red-900"}`}>
            Total Weight: {module.assignments.reduce((s, a) => s + a.weight, 0)}% {isValid(yearId, module.id) ? "(OK)" : "(Must sum to 100%)"}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
