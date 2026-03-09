import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import GradeCalculator from "./GradeCalculator"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GradeCalculator mode="new" />} />
        <Route path="/old" element={<GradeCalculator mode="old" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
