import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Users, MapPin, Clock, LogOut, DollarSign, FileText, BadgeCheck } from 'lucide-react'
import { supabase, Profile, Route } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AdminUsers } from '../components/admin/AdminUsers'
import { AdminRoutes } from '../components/admin/AdminRoutes'
import { AdminPurchases } from '../components/admin/AdminPurchases'
import { AdminBlog } from '../components/admin/AdminBlog'
import { AdminVerifications } from '../components/admin/AdminVerifications'

type Tab = 'overview' | 'users' | 'routes' | 'purchases' | 'blog' | 'verifications'

export function AdminPanel() {
  const { profile, isAdmin, isStaff, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [pendingCount, setPendingCount] = useState(0)
  const [routeCount, setRouteCount] = useState(0)
  const [purchaseCount, setPurchaseCount] = useState(0)
  const [verificationCount, setVerificationCount] = useState(0)

  useEffect(() => {
    if (!loading && (!profile || !isStaff)) {
      navigate('/admin/login')
    }
  }, [profile, isStaff, loading, navigate])

  useEffect(() => {
    if (isStaff) {
      if (isAdmin) {
        supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'pendiente')
          .then(({ count }) => setPendingCount(count || 0))
        supabase.from('routes').select('id', { count: 'exact' })
          .then(({ count }) => setRouteCount(count || 0))
        supabase.from('purchases').select('id', { count: 'exact' })
          .then(({ count }) => setPurchaseCount(count || 0))
        supabase.from('guide_verifications').select('id', { count: 'exact' }).eq('status', 'pendiente')
          .then(({ count }) => setVerificationCount(count || 0))
      }
    }
  }, [isStaff, isAdmin, tab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-forest-600 border-t-transparent" />
      </div>
    )
  }

  if (!isStaff) return null

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'overview', label: 'Resumen', icon: ShieldCheck },
    ...(isAdmin ? [{ id: 'users' as Tab, label: 'Usuarios', icon: Users, badge: pendingCount }] : []),
    ...(isAdmin ? [{ id: 'routes' as Tab, label: 'Rutas', icon: MapPin }] : []),
    ...(isAdmin ? [{ id: 'purchases' as Tab, label: 'Compras', icon: DollarSign }] : []),
    { id: 'blog', label: 'Blog', icon: FileText },
    ...(isAdmin ? [{ id: 'verifications' as Tab, label: 'Verificaciones', icon: BadgeCheck, badge: verificationCount }] : []),
  ]

  return (
    <div className="min-h-screen bg-sand-100">
      {/* Top bar */}
      <div className="bg-sand-900 text-sand-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-forest-400" />
          <div>
            <p className="font-serif text-lg">Panel de administración</p>
            <p className="text-xs text-sand-400">{isAdmin ? 'Administrador' : 'Editor'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-sand-300 hover:text-white transition-colors">Ver web</a>
          <button onClick={async () => { await signOut(); navigate('/') }} className="flex items-center gap-2 text-sm text-sand-300 hover:text-white">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-sand-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all ${
                tab === t.id
                  ? 'border-forest-600 text-forest-700'
                  : 'border-transparent text-sand-500 hover:text-sand-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge ? (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isAdmin ? (
              <>
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-sand-500">Pendientes</p>
                  </div>
                  <p className="font-serif text-4xl text-sand-900">{pendingCount}</p>
                  <p className="text-sm text-sand-500 mt-1">usuarios esperando aprobación</p>
                  <button onClick={() => setTab('users')} className="mt-3 text-sm text-forest-600 font-medium hover:underline">
                    Gestionar →
                  </button>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-forest-600" />
                    </div>
                    <p className="text-sm text-sand-500">Rutas</p>
                  </div>
                  <p className="font-serif text-4xl text-sand-900">{routeCount}</p>
                  <p className="text-sm text-sand-500 mt-1">rutas en la plataforma</p>
                  <button onClick={() => setTab('routes')} className="mt-3 text-sm text-forest-600 font-medium hover:underline">
                    Gestionar →
                  </button>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-ocean-50 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-ocean-600" />
                    </div>
                    <p className="text-sm text-sand-500">Compras</p>
                  </div>
                  <p className="font-serif text-4xl text-sand-900">{purchaseCount}</p>
                  <p className="text-sm text-sand-500 mt-1">compras realizadas</p>
                  <button onClick={() => setTab('purchases')} className="mt-3 text-sm text-forest-600 font-medium hover:underline">
                    Ver →
                  </button>
                </div>

                <div className="card p-6 md:col-span-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-sand-500">Verificaciones de guias</p>
                  </div>
                  <p className="font-serif text-4xl text-sand-900">{verificationCount}</p>
                  <p className="text-sm text-sand-500 mt-1">solicitudes pendientes de revisión</p>
                  <button onClick={() => setTab('verifications')} className="mt-3 text-sm text-forest-600 font-medium hover:underline">
                    Gestionar →
                  </button>
                </div>
              </>
            ) : (
              <div className="card p-8 md:col-span-3 text-center">
                <FileText className="w-10 h-10 text-forest-600 mx-auto mb-3" />
                <p className="font-serif text-xl text-sand-900 mb-2">Bienvenido al panel editorial</p>
                <p className="text-sand-500">Puedes crear y gestionar artículos del blog desde la pestaña Blog.</p>
                <button onClick={() => setTab('blog')} className="mt-4 btn-primary text-sm inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Ir al blog
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && <AdminUsers />}
        {tab === 'routes' && <AdminRoutes />}
        {tab === 'purchases' && <AdminPurchases />}
        {tab === 'blog' && <AdminBlog />}
        {tab === 'verifications' && <AdminVerifications />}
      </div>
    </div>
  )
}
