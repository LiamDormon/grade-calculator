import React, { useEffect } from "react"
import { useGradeStore } from "../lib/store"
import ModuleCard from "./ModuleCard"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import MultiProgress from "./ui/multiProgress"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Module } from "../lib/types";

function SortableModuleCard({ id, module, yearId }: { id: string, module: Module, yearId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.9 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "shadow-2xl scale-[1.02] rounded-base" : ""}>
       <ModuleCard 
         yearId={yearId} 
         module={module} 
         dragAttributes={attributes}
         dragListeners={listeners}
       />
    </div>
  );
}


export default function YearView() {
  const years = useGradeStore((s) => s.years)
  const activeYearId = useGradeStore((s) => s.activeYearId)
  const setActiveYear = useGradeStore((s) => s.setActiveYear)
  const addModule = useGradeStore((s) => s.addModule)
  const reorderModules = useGradeStore((s) => s.reorderModules)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!activeYearId && years[0]) setActiveYear(years[0].id)
  }, [activeYearId, years, setActiveYear])

  const getYearSegments = useGradeStore((s) => s.getYearSegments)

  const year = years.find((y) => y.id === activeYearId) ?? years[0]

  if (!year) return <div className="p-4">No years defined yet</div>

  const anyInvalid = year.modules.some((m) => !useGradeStore.getState().isModuleAssignmentsValid(year.id, m.id))
  const yearSegments = getYearSegments(year.id)

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
       reorderModules(year.id, active.id as string, over.id as string);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-start gap-4">
          <div>
            <h2 className="text-xl font-bold">{year.name}</h2>
            <div className="text-sm text-muted-foreground">Credits total: <strong>{year.modules.reduce((s, m) => s + m.credits, 0)}</strong></div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Weight (%)</span>
              <Input className="w-24 bg-secondary-background" type="number" step="0.1" min={0} max={100} value={String(Number((year.weight * 100).toFixed(1)))} onChange={(e) => { const val = Number(e.target.value); if (!Number.isNaN(val)) useGradeStore.getState().updateYear(year.id, { weight: val / 100 }) }} />
            </label>
          </div>
        </div>

        <div className="mt-3">
          <div>
            <MultiProgress segments={[
              { value: yearSegments.completed, color: "var(--chart-1)", title: `Achieved ${yearSegments.completed}%` },
              { value: yearSegments.missed, color: "var(--chart-4)", title: `Missed ${yearSegments.missed}%` },
              { value: yearSegments.remaining, color: "var(--secondary-background)", title: `Remaining ${yearSegments.remaining}%` }
            ]} />

            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <div title={`Completed ${yearSegments.completed}%`}><strong>Achieved</strong> {yearSegments.completed}%</div>
              <div title={`Missed ${yearSegments.missed}%`}><strong>Missed</strong> {yearSegments.missed}%</div>
              <div title={`Remaining ${yearSegments.remaining}%`}><strong>Remaining</strong> {yearSegments.remaining}%</div>
            </div>
          </div>
        </div>

        {anyInvalid && <div className="text-red-600 font-bold mt-2">Some modules have assignment weights that do not sum to 100%</div>}
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={year.modules.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {year.modules.length === 0 ? (
              <div className="text-sm text-muted-foreground">No modules yet — add one below</div>
            ) : (
              year.modules.map((m) => (
                <SortableModuleCard key={m.id} id={m.id} yearId={year.id} module={m} />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <AddModuleForm yearId={year.id} addModule={addModule} />
      </div>
    </div>
  )
}

function AddModuleForm({ yearId, addModule }: { yearId: string; addModule: (yearId: string, module: Partial<import("../lib/types").Module>) => void }) {
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [credits, setCredits] = React.useState(20)

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!code) return
    addModule(yearId, { code, name, credits })
    setCode("")
    setName("")
    setCredits(20)
  }

  return (
    <div className="border-2 border-dashed border-border rounded-base p-4 bg-secondary-background/50 hover:bg-secondary-background transition-colors">
      <h3 className="text-sm font-bold uppercase mb-2 text-muted-foreground">Add New Module</h3>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Input placeholder="Code (CS101)" value={code} onChange={(e) => setCode(e.target.value)} className="w-full sm:w-36 bg-secondary-background" />
        <Input placeholder="Module name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 w-full bg-secondary-background" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Input className="w-24 bg-secondary-background" type="number" placeholder="Credits" value={String(credits)} onChange={(e) => setCredits(Number(e.target.value))} />
          <Button type="submit" className="flex-1 sm:flex-none">Add</Button>
        </div>
      </form>
    </div>
  )
}
