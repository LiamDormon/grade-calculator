import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import YearTabs from "./components/YearTabs"
import YearView from "./components/YearView"
import Summary from "./components/Summary"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Github, InfoIcon, Moon, Sun } from "lucide-react"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover"

const MODE_INFO = {
  new: {
    label: "Weighted Average",
    description: "Weighted average across all years. Weighted by module credits and year contribution (e.g., 20% for Year 1, 40% for Year 2, 40% for Year 3).",
  },
  old: {
    label: "Weighted Median",
    description: "Calculates a weighted grade for all of your modules, then ranks them where each module appears more frequently depending on credits and level of study. The median value of the ranked list determines your classification.",
  },
} as const

interface GradeCalculatorProps {
  mode: "new" | "old"
}

export default function GradeCalculator({ mode }: GradeCalculatorProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme")
      if (saved) return saved === "dark"
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return false
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  return (
    <div className="min-h-screen text-foreground font-base selection:bg-main selection:text-main-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-border pb-6 bg-secondary-background p-6 rounded-base shadow-shadow border-2">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading uppercase tracking-black">University Grade Calculator</h1>
              <p className="text-muted-foreground font-medium mt-1">Track your modules, assignments, and target grades.</p>
            </div>
            <nav className="flex flex-col gap-2 mt-1 md:flex-row md:w-2/3" aria-label="Calculation mode">
                {(["new", "old"] as const).map((m) => {
                    const active = mode === m
                    return (
                      <Button asChild size="sm" variant={active ? "default" : "neutral"} className={cn("w-full", active && "cursor-default")}>
                      <Link to={m === "new" ? "/" : "/old"} onClick={(e) => active && e.preventDefault()} aria-current={active ? "page" : undefined}>
                          {MODE_INFO[m].label}
                      </Link>
                      </Button>
                    )
                })}

                {/* Info Icon */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="neutral"
                      className="h-9 w-9 shrink-0"
                      aria-label="About calculation modes"
                    >
                      <InfoIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 bg-secondary-background border-2 border-border shadow-shadow">
                    <h3 className="font-bold mb-2">Calculation Modes</h3>
                    <div className="space-y-4">
                      {(["new", "old"] as const).map((m) => (
                        <div key={m}>
                          <h4 className="font-semibold">{MODE_INFO[m].label}</h4>
                          <p className="text-sm text-muted-foreground">{MODE_INFO[m].description}</p>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

            </nav>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="noShadow" onClick={() => setIsDark(!isDark)} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <a href="https://github.com/LiamDormon/grade-calculator" target="_blank" rel="noreferrer">
              <Button size="icon" variant="noShadow">
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </a>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Grade Area */}
          <section className="lg:col-span-2 space-y-6">
            <YearTabs />
            <YearView />
          </section>

          {/* Sidebar Summary */}
          <aside className="lg:col-span-1 lg:sticky lg:top-8 space-y-6">
            <Summary mode={mode} />

            <Card className="border-2 border-border shadow-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Grade Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 text-sm font-medium">
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-secondary-background rounded-base">
                    <span className="font-bold">First</span>
                    <span className="font-black text-chart-2">69.5+</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-secondary-background rounded-base">
                    <span className="font-bold">2:1</span>
                    <span className="font-black text-chart-5">60-69</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-secondary-background rounded-base">
                    <span className="font-bold">2:2</span>
                    <span className="font-black text-chart-3">50-59</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-secondary-background rounded-base">
                    <span className="font-bold">Third</span>
                    <span className="font-black text-chart-4">40-49</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-secondary-background rounded-base">
                    <span className="font-bold">Fail</span>
                    <span className="font-black text-muted-foreground">&lt;40</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>

        <footer className="text-center text-sm text-muted-foreground py-6 mt-12">
          <p>&copy; {new Date().getFullYear()} Liam Dormon</p>
        </footer>
      </div>
    </div>
  )
}
