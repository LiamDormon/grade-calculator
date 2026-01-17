import { useGradeStore } from "../lib/store"
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"


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

  return (
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
            <SelectTrigger className="w-full bg-white">
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

        {anyInvalidModule && <div className="warn mb-1">Some modules have assignment weights that do not sum to 100%</div>}
        {Math.abs(totalYearWeight - 1) > 0.001 && <div className="warn">Year weights do not sum to 1. They will be normalized when computing final grade.</div>}
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted">Choose a desired grade to see targets for incomplete modules</div>
      </CardFooter>
    </Card>
  )
}
