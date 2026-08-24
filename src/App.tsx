import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { LandingPage } from './pages/LandingPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AdminLogin } from './pages/AdminLogin'
import { AdminPanel } from './pages/AdminPanel'
import { MyRoutesPage } from './pages/MyRoutesPage'
import { PublishRoutePage } from './pages/PublishRoutePage'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta oculta de admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Rutas públicas */}
        <Route path="/" element={
          <PublicLayout><LandingPage /></PublicLayout>
        } />
        <Route path="/ruta/:id" element={
          <PublicLayout><RouteDetailPage /></PublicLayout>
        } />
        <Route path="/mis-rutas" element={
          <PublicLayout><MyRoutesPage /></PublicLayout>
        } />
        <Route path="/publicar" element={
          <PublicLayout><PublishRoutePage /></PublicLayout>
        } />
      </Routes>
    </AuthProvider>
  )
}
