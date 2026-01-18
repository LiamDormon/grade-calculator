import { useGradeStore } from "../lib/store"
import type { GradeSnapshot } from "../lib/types"
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Button } from "./ui/button"
import { Download, Upload, ChevronDown } from "lucide-react"
import { useRef, useState, useEffect } from "react"


export default function Summary() {
  const final = useGradeStore((s) => s.getFinalGrade())
  const years = useGradeStore((s) => s.years)
  const anyInvalidModule = years.some((y) => y.modules.some((m) => !useGradeStore.getState().isModuleAssignmentsValid(y.id, m.id)))
  const totalYearWeight = years.reduce((s, y) => s + y.weight, 0)

  function classify(n?: number) {
    if (n === undefined) return "—"
    if (n >= 70) return "First"
    if (n >= 60) return "2:1"
    if (n >= 50) return "2:2"
    if (n >= 40) return "Third"
    return "Fail"
  }

  const setDesired = useGradeStore((s) => s.setDesiredGrade)
  const importState = useGradeStore((s) => s.importState)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showExportMenu, setShowExportMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuRef])

  const handleExport = (includeGrades: boolean = true) => {
    const state = useGradeStore.getState()
    // Deep clone to avoid mutating store if we strip things (though we are creating new objects)
    const data: GradeSnapshot = {
      years: state.years,
      activeYearId: state.activeYearId,
      desiredGrade: state.desiredGrade
    }
    
    if (!includeGrades) {
       data.desiredGrade = undefined
       data.years = data.years.map((y) => ({
         ...y,
         modules: y.modules.map((m) => ({
           ...m,
           assignments: m.assignments.map((a) => ({
             ...a,
             score: undefined,
             done: false,
             subTasks: a.subTasks?.map((t) => ({ ...t, score: undefined, done: false }))
           }))
         }))
       }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `grades-${includeGrades ? 'full' : 'structure'}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        importState(json)
      } catch (err) {
        console.error("Failed to parse file", err)
        alert("Failed to parse grade file")
      }
    }
    reader.readAsText(file)
    // reset
    e.target.value = ""
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="font-heading text-lg">Final grade</div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-heading mb-1">{final ?? "—"}</div>
          <div className="text-sm text-muted-foreground mb-4">Classification: <strong>{classify(final)}</strong></div>

          <div className="mb-4 space-y-2">
            <div className="text-sm text-muted-foreground font-semibold">Desired final grade</div>
            <Select onValueChange={(v) => setDesired(v ? Number(v) : undefined)}>
              <SelectTrigger className="w-full bg-secondary-background text-foreground">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70 (First)</SelectItem>
                <SelectItem value="60">60 (2:1)</SelectItem>
                <SelectItem value="50">50 (2:2)</SelectItem>
                <SelectItem value="40">40 (Third)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            Choose a desired grade to see targets for incomplete modules
          </div>

          {anyInvalidModule && <div className="warn mt-4 text-red-600 font-bold">Some modules have assignment weights that do not sum to 100%</div>}
          {Math.abs(totalYearWeight - 1) > 0.001 && <div className="warn mt-2 text-amber-600 font-bold">Year weights do not sum to 1. They will be normalized when computing final grade.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            
          <div className="relative flex w-full" ref={menuRef}>
            <Button variant="neutral" className="flex-1 justify-start gap-2 rounded-r-none border-r-0" onClick={() => handleExport(true)}>
                <Download className="w-4 h-4" /> Export Data
            </Button>
            <Button variant="neutral" className="px-2 rounded-l-none" onClick={() => setShowExportMenu(!showExportMenu)}>
                <ChevronDown className="w-4 h-4" />
            </Button>

            {showExportMenu && (
                <div className="absolute top-full left-0 w-full mt-2 z-20 bg-main border-2 border-border shadow-shadow rounded-base p-1 flex flex-col gap-1 overflow-hidden">
                    <Button variant="noShadow" size="sm" className="w-full justify-start text-left font-normal" onClick={() => handleExport(true)}>
                        With Grades
                    </Button>
                    <Button variant="noShadow" size="sm" className="w-full justify-start text-left font-normal" onClick={() => handleExport(false)}>
                        Modules Only (Structure)
                    </Button>
                </div>
            )}
          </div>

          <Button variant="neutral" className="w-full justify-start gap-2" onClick={handleImportClick}>
            <Upload className="w-4 h-4" /> Import Data (JSON)
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".json"
          />
        </CardContent>
      </Card>
    </div>
  )
}
