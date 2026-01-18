import React, { useState } from "react"
import { useGradeStore } from "../lib/store"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Trash2 } from "lucide-react"

export default function YearTabs() {
  const years = useGradeStore((s) => s.years)
  const activeYearId = useGradeStore((s) => s.activeYearId)
  const setActiveYear = useGradeStore((s) => s.setActiveYear)
  const addYear = useGradeStore((s) => s.addYear)
  const removeYear = useGradeStore((s) => s.removeYear)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [weight, setWeight] = useState<number>(0.5)

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!name.trim()) return
    const id = addYear(name.trim(), weight)
    setName("")
    setWeight(0)
    setShowForm(false)
    setActiveYear(id)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <Tabs defaultValue={activeYearId ?? (years[0]?.id ?? "") } onValueChange={(v) => setActiveYear(v)} className="w-full sm:w-auto">
        <TabsList>
          {years.map((y) => (
            <TabsTrigger key={y.id} value={y.id}>{y.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {showForm ? (
          <form onSubmit={submit} className="flex gap-2 items-center bg-card p-1 rounded-base border-2 border-border shadow-sm">
            <label className="block sr-only">Year name</label>
            <Input placeholder="Year name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-32" />
            <label className="block sr-only">Weight</label>
            <Input className="h-9 w-20" type="number" step="0.01" min={0} max={1} value={String(weight)} onChange={(e) => setWeight(Number(e.target.value))} />
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" size="sm" variant="neutral" onClick={() => setShowForm(false)}>✕</Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="neutral" onClick={() => setShowForm(true)} size="sm">
              + Add Year
            </Button>
            {activeYearId && (
              <Button size="icon" variant="neutral" className="h-9 w-9 bg-destructive" onClick={() => removeYear(activeYearId)} title="Remove active year">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
