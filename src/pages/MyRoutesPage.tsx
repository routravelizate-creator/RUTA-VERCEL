import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Download, FileText, ExternalLink, Loader as Loader2, Lock, ArrowRight } from 'lucide-react'
import { supabase, Route } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface PurchaseWithRoute extends Route {
  purchase_id: string
  purchased_at: string
}

export function MyRoutesPage() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<PurchaseWithRoute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!profile || profile.status !== 'aprobado')) {
      navigate('/')
    }
  }, [profile, authLoading, navigate])

  useEffect(() => {
    if (profile) {
      supabase
        .from('purchases')
        .select(`
          id,
          created_at,
          routes!inner(*)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const mapped = data.map((p: any) => ({
              ...p.routes,
              purchase_id: p.id,
              purchased_at: p.created_at,
            })) as PurchaseWithRoute[]
            setRoutes(mapped)
          }
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

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-sand-900 mb-2">Mis rutas</h1>
          <p className="text-sand-600">Las rutas que has comprado. Descarga los archivos y abre los mapas cuando quieras.</p>
        </div>

        {routes.length === 0 ? (
          <div className="card p-12 text-center">
            <Lock className="w-12 h-12 text-sand-300 mx-auto mb-4" />
            <p className="text-sand-600 mb-2">Aún no has comprado ninguna ruta.</p>
            <Link to="/#rutas" className="inline-flex items-center gap-2 text-forest-600 font-medium hover:underline mt-2">
              Explorar rutas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {routes.map(route => (
              <div key={route.purchase_id} className="card overflow-hidden">
                <div className="relative h-40">
                  <img src={route.image_url} alt={route.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-sand-900/60 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="font-serif text-xl text-white">{route.title}</h3>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {route.subtitle}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {route.gpx_url && (
                      <a href={route.gpx_url} download className="flex flex-col items-center gap-1 p-3 rounded-xl bg-sand-50 border border-sand-200 hover:border-forest-400 transition-all">
                        <Download className="w-5 h-5 text-forest-600" />
                        <span className="text-xs font-medium text-sand-700">GPX</span>
                      </a>
                    )}
                    {route.pdf_url && (
                      <a href={route.pdf_url} download className="flex flex-col items-center gap-1 p-3 rounded-xl bg-sand-50 border border-sand-200 hover:border-forest-400 transition-all">
                        <FileText className="w-5 h-5 text-forest-600" />
                        <span className="text-xs font-medium text-sand-700">PDF</span>
                      </a>
                    )}
                    {route.mymaps_url && (
                      <a href={route.mymaps_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-sand-50 border border-sand-200 hover:border-forest-400 transition-all">
                        <ExternalLink className="w-5 h-5 text-forest-600" />
                        <span className="text-xs font-medium text-sand-700">My Maps</span>
                      </a>
                    )}
                  </div>
                  <Link to={`/ruta/${route.id}`} className="block mt-3 text-center text-sm text-forest-600 font-medium hover:underline">
                    Ver detalle de la ruta →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
