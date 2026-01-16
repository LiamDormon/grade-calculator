import "./App.css"
import YearTabs from "./components/YearTabs"
import YearView from "./components/YearView"
import Summary from "./components/Summary"
import { Card, CardHeader, CardContent } from "./components/ui/card"

function App() {
  return (
    <div className="min-h-screen p-6 bg-background text-foreground">
      <header className="mb-6">
        <Card className="mb-6">
          <CardHeader className="flex items-center justify-center gap-4">
            <div>
              <div className="text-3xl font-extrabold">University Grade Calculator</div>
              <div className="text-sm text-muted">Define years, modules and assignments. Assignments per module must sum to 100%.</div>
            </div>
          </CardHeader>
        </Card>
      </header>

      <main className="grid grid-cols-3 gap-6">
        <section className="col-span-2">
          <Card>
            <CardHeader>
              <YearTabs />
            </CardHeader>
            <CardContent>
              <YearView />
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Summary />
          <Card>
            <CardHeader>
              <div className="font-heading">Legend</div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm">
                <li>First: 70+ (strong performance)</li>
                <li>2:1: 60-69</li>
                <li>2:2: 50-59</li>
                <li>Third: 40-49</li>
                <li>Fail: &lt;40</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}

export default App
