import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DollarSign, TrendingUp, MapPin, Download, FileText, ArrowRight, Loader as Loader2 } from 'lucide-react'
import { supabase, Route, Purchase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface SaleWithRoute extends Purchase {
  route: Route
}

export function EarningsPage() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [sales, setSales] = useState<SaleWithRoute[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!profile || profile.status !== 'aprobado' || profile.role !== 'routraveler')) {
      navigate('/')
    }
  }, [profile, authLoading, navigate])

  useEffect(() => {
    if (profile) {
      Promise.all([
        supabase
          .from('purchases')
          .select('*, routes!inner(*)')
          .eq('payment_status', 'pagado')
          .eq('routes.author_id', profile.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => data as SaleWithRoute[] || []),
        supabase
          .from('routes')
          .select('*')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => data as Route[] || []),
      ]).then(([salesData, routesData]) => {
        setSales(salesData)
        setRoutes(routesData)
        setLoading(false)
      })
    }
  }, [profile])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
      </div>
    )
  }

  const totalEarnings = sales.reduce((sum, s) => sum + Number(s.author_earnings || 0), 2)
  const totalSales = sales.length
  const totalPlatform = sales.reduce((sum, s) => sum + Number(s.platform_commission || 0), 2)
  const publishedRoutes = routes.filter(r => r.is_published).length

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-sand-900 mb-2">Mis ganancias</h1>
          <p className="text-sand-600">Resumen de tus ventas y comisiones como creador de rutas.</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-forest-600" />
              </div>
              <p className="text-sm text-sand-500">Ganancias totales</p>
            </div>
            <p className="font-serif text-4xl text-sand-900">{totalEarnings.toFixed(2)}€</p>
            <p className="text-sm text-sand-500 mt-1">tu parte (80%)</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-ocean-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-ocean-600" />
              </div>
              <p className="text-sm text-sand-500">Ventas totales</p>
            </div>
            <p className="font-serif text-4xl text-sand-900">{totalSales}</p>
            <p className="text-sm text-sand-500 mt-1">compras completadas</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm text-sand-500">Rutas publicadas</p>
            </div>
            <p className="font-serif text-4xl text-sand-900">{publishedRoutes}</p>
            <p className="text-sm text-sand-500 mt-1">de {routes.length} creadas</p>
          </div>
        </div>

        {/* Comision de la plataforma */}
        <div className="card p-5 mb-8 bg-sand-50 border-sand-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sand-600">Comision de la plataforma (20%)</p>
              <p className="font-serif text-2xl text-sand-900">{totalPlatform.toFixed(2)}€</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-sand-600">Total recaudado</p>
              <p className="font-serif text-2xl text-sand-900">{(totalEarnings + totalPlatform).toFixed(2)}€</p>
            </div>
          </div>
        </div>

        {/* Detalle de ventas */}
        <h2 className="font-serif text-2xl text-sand-900 mb-4">Historial de ventas</h2>

        {sales.length === 0 ? (
          <div className="card p-12 text-center">
            <DollarSign className="w-10 h-10 text-sand-300 mx-auto mb-3" />
            <p className="text-sand-500 mb-4">Todavia no has vendido ninguna ruta.</p>
            <Link to="/publicar" className="inline-flex items-center gap-2 text-forest-600 font-medium hover:underline">
              Publicar una ruta <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map(sale => (
              <div key={sale.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center overflow-hidden">
                    {sale.route?.image_url ? (
                      <img src={sale.route.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MapPin className="w-6 h-6 text-sand-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sand-900">{sale.route?.title || 'Ruta'}</p>
                    <p className="text-sm text-sand-500">
                      {new Date(sale.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-sand-400">
                      {sale.guest_email ? `Invitado: ${sale.guest_email}` : 'Usuario registrado'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-lg text-forest-700">+{Number(sale.author_earnings || 0).toFixed(2)}€</p>
                  <p className="text-xs text-sand-400">Comision: {Number(sale.platform_commission || 0).toFixed(2)}€</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mis rutas creadas */}
        {routes.length > 0 && (
          <>
            <h2 className="font-serif text-2xl text-sand-900 mb-4 mt-10">Mis rutas</h2>
            <div className="space-y-3">
              {routes.map(route => (
                <Link key={route.id} to={`/ruta/${route.id}`} className="card p-5 flex items-center justify-between flex-wrap gap-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center overflow-hidden">
                      {route.image_url ? (
                        <img src={route.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <MapPin className="w-6 h-6 text-sand-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sand-900">{route.title}</p>
                      <p className="text-sm text-sand-500">{route.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg text-sand-900">{route.price}€</span>
                    {route.is_published ? (
                      <span className="px-2.5 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-medium">Publicada</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-sand-200 text-sand-700 text-xs font-medium">Borrador</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
