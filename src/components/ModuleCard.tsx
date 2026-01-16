import React, { useState } from "react"
import type { Module as ModType } from "../lib/types"
import { useGradeStore } from "../lib/store"
import AssignmentRow from "./AssignmentRow"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import MultiProgress from "./ui/multiProgress"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Trash2 } from "lucide-react"

export default function ModuleCard({ yearId, module }: { yearId: string; module: ModType }) {
  const addAssignment = useGradeStore((s) => s.addAssignment)
  const removeModule = useGradeStore((s) => s.removeModule)
  const getModuleAverage = useGradeStore((s) => s.getModuleAverage)
  const isValid = useGradeStore((s) => s.isModuleAssignmentsValid)

  const [showAdd, setShowAdd] = useState(false)
  const [aName, setAName] = useState("")
  const [aWeight, setAWeight] = useState(0)

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
    setShowAdd(false)
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="module-title">{module.code} {module.name ? `— ${module.name}` : ""}</div>
            <div className="module-meta">{module.credits} credits</div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="neutral" className="h-8 w-8 p-0" aria-label="Remove module" title="Remove module" onClick={() => removeModule(yearId, module.id)}>
              <Trash2 />
            </Button>
          </div>
        </div>

        <div className="module-header">
          <div className="flex items-center justify-between">
            <div className="text-sm">Module score: <strong>{getModuleAverage(yearId, module.id)?.toFixed(1) ?? "0.0"}</strong></div>
          </div>

          <div className="mt-3">
            {/* multi-segment progress: completed (purple), missed (red), remaining (light) */}
            <div>
              <MultiProgress segments={[
                { value: segments.completed, color: "var(--accent)", title: `Completed ${segments.completed}%` },
                { value: segments.missed, color: "#ff7a7a", title: `Missed ${segments.missed}%` },
                { value: segments.remaining, color: "#e6e6e6", title: `Remaining ${segments.remaining}%` }
              ]} />

              <div className="mt-2 flex gap-4 text-sm text-muted">
                <div title={`Completed ${segments.completed}%`}><strong>Done</strong> {segments.completed}%</div>
                <div title={`Missed ${segments.missed}%`}><strong>Missed</strong> {segments.missed}%</div>
                <div title={`Remaining ${segments.remaining}%`}><strong>Rem</strong> {segments.remaining}%</div>
              </div>

              {/* desired-grade hint: show required average on remaining assignments for this module */}
              {desired !== undefined && (
                <div className="mt-1 text-sm text-muted">
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

      <CardFooter className="flex items-center gap-2">
        {showAdd ? (
          <form onSubmit={add} className="flex gap-2 items-center w-full">
            <Input placeholder="name" value={aName} onChange={(e) => setAName(e.target.value)} />
            <Input className="w-24" type="number" value={String(aWeight)} onChange={(e) => setAWeight(Number(e.target.value))} />
            <Button type="submit">Add</Button>
            <Button variant="neutral" onClick={() => setShowAdd(false)}>Cancel</Button>
          </form>
        ) : (
          <Button onClick={() => setShowAdd(true)}>Add Assignment</Button>
        )}

        <div className={`ml-auto text-sm ${isValid(yearId, module.id) ? "ok" : "warn"}`}>
          Sum: {module.assignments.reduce((s, a) => s + a.weight, 0)}% {isValid(yearId, module.id) ? "(OK)" : "(Must sum to 100%)"}
        </div>
      </CardFooter>
    </Card>
  )
}
