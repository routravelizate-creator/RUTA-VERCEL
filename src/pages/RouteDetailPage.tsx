import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { MapPin, Download, FileText, CreditCard, Loader as Loader2, CircleCheck as CheckCircle, Lock, ArrowLeft, ExternalLink, Mail } from 'lucide-react'
import { supabase, Route, Waypoint } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function RouteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, loading: authLoading } = useAuth()
  const [route, setRoute] = useState<Route | null>(null)
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [showGuestInput, setShowGuestInput] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [generatingGpx, setGeneratingGpx] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRoute(data as Route)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (id) {
      supabase
        .from('route_waypoints')
        .select('*')
        .eq('route_id', id)
        .order('ord', { ascending: true })
        .then(({ data }) => setWaypoints(data || []))
    }
  }, [id])

  useEffect(() => {
    if (profile && id) {
      supabase
        .from('purchases')
        .select('id')
        .eq('route_id', id)
        .eq('user_id', profile.id)
        .eq('payment_status', 'pagado')
        .maybeSingle()
        .then(({ data }) => setHasPurchased(!!data))
    }
  }, [profile, id])

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      const checkPayment = async () => {
        if (!id) return
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 1500))
          const { data } = await supabase
            .from('purchases')
            .select('id, payment_status')
            .eq('route_id', id)
            .eq('payment_status', 'pagado')
            .maybeSingle()
          if (data) {
            setHasPurchased(true)
            return
          }
        }
      }
      checkPayment()
    }
  }, [searchParams, id])

  const handlePay = async () => {
    setError('')
    if (!route) return
    setPaying(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          route_id: id,
          user_id: profile?.id || null,
          guest_email: !profile ? guestEmail : null,
          origin: window.location.origin,
        }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Error al procesar el pago')
      }
      const { url } = await response.json()
      if (url) window.location.href = url
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
      setPaying(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!id) return
    setGeneratingPdf(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ route_id: id }),
      })
      const data = await response.json()
      if (data.html) {
        const blob = new Blob([data.html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${route?.title?.replace(/[^a-z0-9]/gi, '_') || 'ruta'}_itinerario.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch {
      setError('No se pudo generar el PDF.')
    }
    setGeneratingPdf(false)
  }

  const handleDownloadGpx = async () => {
    if (!id) return
    setGeneratingGpx(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-gpx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ route_id: id }),
      })
      const data = await response.json()
      if (data.gpx) {
        const blob = new Blob([data.gpx], { type: 'application/gpx+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${route?.title?.replace(/[^a-z0-9]/gi, '_') || 'ruta'}.gpx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch {
      setError('No se pudo generar el GPX.')
    }
    setGeneratingGpx(false)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sand-600">Ruta no encontrada.</p>
        <Link to="/" className="btn-primary">Volver al inicio</Link>
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin' && profile?.status === 'aprobado'
  const isAuthor = profile?.id === route.author_id

  return (
    <div className="min-h-screen pt-20">
      <div className="relative h-80 overflow-hidden">
        <img src={route.image_url} alt={route.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-sand-900/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">{route.title}</h1>
            <p className="text-white/80 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {route.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl text-sand-900 mb-4">Sobre esta ruta</h2>
            <p className="text-sand-700 leading-relaxed whitespace-pre-line">{route.description}</p>

            {waypoints.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-xl text-sand-900 mb-4">Puntos de interes ({waypoints.length})</h3>
                <div className="space-y-3">
                  {waypoints.map((wp, i) => (
                    <div key={wp.id} className="flex gap-3 p-4 rounded-xl bg-sand-50 border border-sand-100">
                      <div className="w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sand-900">{wp.name}</p>
                        {wp.description && <p className="text-sm text-sand-600 mt-1">{wp.description}</p>}
                        {wp.lat != null && wp.lng != null && (
                          <p className="text-xs text-forest-600 font-mono mt-1">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(hasPurchased || isAdmin || isAuthor) && (
              <div className="mt-8 space-y-4">
                <div className="p-5 rounded-xl bg-forest-50 border border-forest-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-forest-600" />
                    <h3 className="font-serif text-lg text-forest-800">
                      {isAdmin ? 'Acceso de administrador' : isAuthor ? 'Eres el autor de esta ruta' : 'Contenido desbloqueado'}
                    </h3>
                  </div>
                  <p className="text-sm text-forest-700 mb-4">
                    {isAdmin ? 'Puedes descargar todos los archivos de esta ruta.' : isAuthor ? 'Puedes descargar los archivos de tu ruta.' : 'Ya puedes descargar los archivos y abrir el mapa.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {route.gpx_url ? (
                      <a href={route.gpx_url} download className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        <Download className="w-6 h-6 text-forest-600" />
                        <span className="text-sm font-medium text-sand-800">GPX</span>
                      </a>
                    ) : waypoints.length > 0 ? (
                      <button onClick={handleDownloadGpx} disabled={generatingGpx} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        {generatingGpx ? <Loader2 className="w-6 h-6 text-forest-600 animate-spin" /> : <Download className="w-6 h-6 text-forest-600" />}
                        <span className="text-sm font-medium text-sand-800">GPX auto</span>
                      </button>
                    ) : null}
                    {route.pdf_url ? (
                      <a href={route.pdf_url} download className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        <FileText className="w-6 h-6 text-forest-600" />
                        <span className="text-sm font-medium text-sand-800">PDF</span>
                      </a>
                    ) : (
                      <button onClick={handleDownloadPdf} disabled={generatingPdf} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        {generatingPdf ? <Loader2 className="w-6 h-6 text-forest-600 animate-spin" /> : <FileText className="w-6 h-6 text-forest-600" />}
                        <span className="text-sm font-medium text-sand-800">PDF auto</span>
                      </button>
                    )}
                    {route.mymaps_url && (
                      <a href={route.mymaps_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        <ExternalLink className="w-6 h-6 text-forest-600" />
                        <span className="text-sm font-medium text-sand-800">My Maps</span>
                      </a>
                    )}
                  </div>
                </div>

                {route.mymaps_url && (
                  <div className="rounded-xl overflow-hidden border border-sand-200">
                    <iframe
                      src={route.mymaps_url}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      loading="lazy"
                      title="Google My Maps"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <div className="card p-6">
                {(hasPurchased || isAdmin || isAuthor) ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-forest-50 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-forest-600" />
                      </div>
                      <p className="font-serif text-xl text-sand-900">
                        {isAdmin ? 'Modo administrador' : isAuthor ? 'Tu ruta' : 'Ruta comprada'}
                      </p>
                      <p className="text-sm text-sand-500 mt-1">Precio: {route.price}€</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-sand-600 text-center">Accede a tus archivos desde el panel superior.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-sand-500 uppercase tracking-wide mb-1">Precio</p>
                    <p className="font-serif text-4xl text-sand-900 mb-1">
                      {route.price === 0 ? 'Gratis' : `${route.price}€`}
                    </p>
                    <p className="text-sm text-sand-500 mb-6">Pago unico · Acceso permanente</p>

                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    {!profile && !showGuestInput && (
                      <>
                        <button
                          onClick={() => setShowGuestInput(true)}
                          className="w-full btn-primary flex items-center justify-center gap-2 mb-3"
                        >
                          <CreditCard className="w-5 h-5" /> Comprar como invitado
                        </button>
                        <button
                          onClick={() => navigate('/ruta/' + id)}
                          className="w-full btn-secondary text-sm mb-3"
                        >
                          <Lock className="w-4 h-4 inline mr-1" /> O inicia sesion
                        </button>
                      </>
                    )}

                    {!profile && showGuestInput && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-sand-700 mb-1 block">Tu email</label>
                        <div className="relative mb-3">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                          <input
                            type="email"
                            required
                            placeholder="tu@email.com"
                            value={guestEmail}
                            onChange={e => setGuestEmail(e.target.value)}
                            className="input-field pl-10 text-sm"
                          />
                        </div>
                        <button
                          onClick={handlePay}
                          disabled={paying || !guestEmail}
                          className="w-full btn-primary flex items-center justify-center gap-2 mb-2"
                        >
                          {paying ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                          ) : (
                            <><CreditCard className="w-5 h-5" /> Pagar {route.price}€</>
                          )}
                        </button>
                        <button onClick={() => setShowGuestInput(false)} className="w-full text-sm text-sand-500 hover:text-sand-700">
                          Cancelar
                        </button>
                      </div>
                    )}

                    {profile && (
                      <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full btn-primary flex items-center justify-center gap-2 mb-3"
                      >
                        {paying ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Procesando pago...</>
                        ) : (
                          <><CreditCard className="w-5 h-5" /> Pagar {route.price}€</>
                        )}
                      </button>
                    )}

                    <div className="space-y-2 text-sm text-sand-600">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-forest-600" /> Archivo GPX descargable
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-forest-600" /> Itinerario en PDF
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-forest-600" /> Mapa en Google My Maps
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-sand-200">
                      <p className="text-xs text-sand-400 text-center">
                        Pago seguro procesado por Stripe
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
