import { useGradeStore } from "../lib/store"
import type { DegreeClass, GradeSnapshot } from "../lib/types"
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Button } from "./ui/button"
import { Download, Upload, ChevronDown } from "lucide-react"
import { useRef, useState, useEffect, useMemo } from "react"


type SummaryProps = {
  mode?: "new" | "old"
}

export default function Summary({ mode = "new" }: SummaryProps) {
  // for the "old" calculation route we simply fall back to the achieved grade
  // but this could be replaced with any alternate algorithm in future
  const final = useGradeStore((s) => (mode === "new" ? s.getFinalGrade() : s.getFinalAchievedGrade()))
  const achieved = useGradeStore((s) => s.getFinalAchievedGrade())
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

  const classColors: Record<DegreeClass, string> = {
    First: "text-chart-2",
    "2:1": "text-chart-5",
    "2:2": "text-chart-4",
    Third: "text-chart-1",
    Fail: "text-destructive",
  }

  function borderlineName(prelim2Class: DegreeClass): string {
    const ranks: DegreeClass[] = ["Fail", "Third", "2:2", "2:1", "First"]
    const idx = ranks.indexOf(prelim2Class)
    return idx < ranks.length - 1 ? `Borderline ${ranks[idx + 1]}` : `Borderline above ${prelim2Class}`
  }

  const oldResult = useMemo(
    () => mode === "old" ? useGradeStore.getState().getOldClassification() : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [years, mode]
  )

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
          <div className="font-heading text-lg">Final Classification</div>
        </CardHeader>
        <CardContent>
          {mode === "old" ? (
            <div className="space-y-4">
              {!oldResult ? (
                <p className="text-sm text-muted-foreground">Add modules to Years 2 and 3 with grades to see your classification.</p>
              ) : (
                <>
                  {/* Stage 1 */}
                  <div className="p-3 border-2 border-border rounded-base bg-secondary-background space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stage 1 - Grade Profile</h3>
                    <p className="text-sm font-medium">
                      <span className="font-black text-foreground">{oldResult.gradeProfile.length}</span> weighted grades
                      <span className="text-muted-foreground"> (base unit: {oldResult.baseUnit} credits)</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Year 1 excluded · Level 3 counted twice</p>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-3 border-2 border-border rounded-base bg-secondary-background space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stage 2 - Weighted Average</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-heading font-black">{oldResult.weightedAverage}</span>
                      <span className={`text-lg font-bold ${classColors[oldResult.prelim1Class]}`}>
                        {oldResult.prelim1Class}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Preliminary classification 1</p>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-3 border-2 border-border rounded-base bg-secondary-background space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stage 3 - Distribution</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">#{oldResult.midRank} grade</span>
                        <div className="font-black text-lg">{oldResult.midGrade}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">#{oldResult.checkRank} grade</span>
                        <div className="font-black text-lg">{oldResult.checkGrade}</div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-lg font-bold ${classColors[oldResult.prelim2Class]}`}>
                        {oldResult.prelim2IsBorderline ? borderlineName(oldResult.prelim2Class) : oldResult.prelim2Class}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Preliminary classification 2</p>
                  </div>

                  {/* Stage 4 */}
                  <div className={`relative p-5 border-2 border-border rounded-base shadow-shadow ${oldResult.needsExamBoard ? "bg-secondary-background" : "bg-main text-main-foreground"}`}>
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Stage 4 - Final Classification</h3>
                    {oldResult.needsExamBoard ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-amber-600">Referred to Exam Board</p>
                        {oldResult.examBoardGrade !== undefined && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-heading font-black">{oldResult.examBoardGrade}</span>
                            <span className={`text-xl font-bold ${classColors[oldResult.examBoardRecommendation!]}`}>
                              {oldResult.examBoardRecommendation}
                            </span>
                          </div>
                        )}
                        <p className="text-xs opacity-70">Preliminary classifications disagree, final class to be decided by the exam board. Recommendation based on final year average.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-heading font-black">{oldResult.finalClass}</span>
                        </div>
                        <p className="text-xs font-medium mt-2 opacity-80">
                          {oldResult.prelim2IsBorderline
                            ? "Preliminary classification 1 falls within the borderline range of classification 2"
                            : "Both preliminary classifications agree"}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {anyInvalidModule && <div className="warn text-red-600 font-bold text-sm">Some modules have assignment weights that do not sum to 100%</div>}
            </div>
          ) : (
          <div className="space-y-4 mb-6">
            
            {/* Primary Card */}
            <div className="relative p-5 border-2 border-border rounded-base bg-main text-main-foreground shadow-shadow">
               <div className="flex flex-col gap-1">
                 <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">On Track</h3>
                 <div className="flex items-baseline gap-3">
                   <span className="text-5xl font-heading font-black">{final ?? "—"}</span>
                   <span className="text-2xl font-bold opacity-90">{classify(final)}</span>
                 </div>
                 <p className="text-xs font-medium mt-2 opacity-80">
                    Projected final grade
                 </p>
               </div>
            </div>

            {/* Secondary Card */}
            <div className="flex items-center justify-between p-5 border-2 border-border rounded-base bg-secondary-background">
               <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Achieved</h4>
                  <span className="text-3xl font-heading font-black text-foreground">{achieved ?? 0}</span>
               </div>
               
               <div className="text-right">
                   <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Class</h4>
                   <span className="text-xl font-bold text-foreground">{classify(achieved)}</span>
               </div>
            </div>

          </div>
          )}

          {mode === "new" && (
          <>
          <div className="mb-4 space-y-2 border-t pt-4">
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
            Choose a desired grade to set targets for incomplete modules
          </div>

          {anyInvalidModule && <div className="warn mt-4 text-red-600 font-bold">Some modules have assignment weights that do not sum to 100%</div>}
          {Math.abs(totalYearWeight - 1) > 0.001 && <div className="warn mt-2 text-amber-600 font-bold">Year weights do not sum to 1. They will be normalised when computing final grade.</div>}
          </>
          )}
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
