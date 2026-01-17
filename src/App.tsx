import YearTabs from "./components/YearTabs"
import YearView from "./components/YearView"
import Summary from "./components/Summary"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Github } from "lucide-react"
import { Button } from "./components/ui/button"

function App() {
  return (
    <div className="min-h-screen text-foreground font-base selection:bg-main selection:text-main-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-border pb-6 bg-white p-6 rounded-base shadow-shadow border-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading uppercase tracking-black">University Grade Calculator</h1>
            <p className="text-muted-foreground font-medium mt-1">Track your modules, assignments, and target grades.</p>
          </div>
          <div className="flex gap-2">
            <a href="https://github.com" target="_blank" rel="noreferrer">
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
            <Summary />
            
            <Card className="border-2 border-border shadow-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Grade Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 text-sm font-medium">
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-white rounded-base">
                    <span className="font-bold">First</span>
                    <span className="font-black text-chart-2">70+</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-white rounded-base">
                    <span className="font-bold">2:1</span>
                    <span className="font-black text-chart-5">60-69</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-white rounded-base">
                    <span className="font-bold">2:2</span>
                    <span className="font-black text-chart-3">50-59</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-white rounded-base">
                    <span className="font-bold">Third</span>
                    <span className="font-black text-chart-4">40-49</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border-2 border-border bg-white rounded-base">
                    <span className="font-bold">Fail</span>
                    <span className="font-black text-muted-foreground">&lt;40</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>
        
        <footer className="text-center text-sm font-bold text-muted-foreground pt-12 pb-4">
          <p>Grades are stored locally in your browser.</p>
        </footer>
      </div>
    </div>
  )
}

export default App
