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
    <div className="p-4 border-b mb-4">
      <Tabs defaultValue={activeYearId ?? (years[0]?.id ?? "") } onValueChange={(v) => setActiveYear(v)}>
        <TabsList>
          {years.map((y) => (
            <TabsTrigger key={y.id} value={y.id}>{y.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="ml-auto mt-3">
        {showForm ? (
          <form onSubmit={submit} className="flex gap-2 items-center">
            <label className="block">
              <div className="text-xs text-muted mb-1">Year name</div>
              <Input placeholder="Year name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <div className="text-xs text-muted mb-1">Weight (0..1)</div>
              <Input className="w-20" type="number" step="0.01" min={0} max={1} value={String(weight)} onChange={(e) => setWeight(Number(e.target.value))} />
            </label>
            <Button type="submit">Add</Button>
            <Button variant="neutral" onClick={() => setShowForm(false)}>Cancel</Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowForm(true)}>Add Year</Button>
            <Button size="icon" variant="reverse" onClick={() => { if (activeYearId) removeYear(activeYearId) }} title="Remove active year" aria-label="Remove active year"><Trash2 /></Button>
          </div>
        )}
      </div>
    </div>
  )
}
