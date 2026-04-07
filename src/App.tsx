import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { Dashboard } from './pages/Dashboard'
import { Today } from './pages/Today'
import { Seasons } from './pages/Seasons'
import { Vision } from './pages/Vision'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
        <TopNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/today" element={<Today />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/vision" element={<Vision />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
