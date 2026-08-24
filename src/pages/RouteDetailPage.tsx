import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Download, FileText, CreditCard, Loader as Loader2, CircleCheck as CheckCircle, Lock, ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase, Route } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function RouteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [route, setRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [paying, setPaying] = useState(false)
  const [justPaid, setJustPaid] = useState(false)
  const [error, setError] = useState('')

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
    if (profile && id) {
      supabase
        .from('purchases')
        .select('id')
        .eq('route_id', id)
        .eq('user_id', profile.id)
        .maybeSingle()
        .then(({ data }) => setHasPurchased(!!data))
    }
  }, [profile, id])

  const handlePay = async () => {
    setError('')
    if (!profile) {
      setError('Debes iniciar sesión para comprar una ruta.')
      return
    }
    if (profile.status !== 'aprobado') {
      setError('Tu cuenta debe estar aprobada por el administrador antes de comprar.')
      return
    }

    setPaying(true)
    // Simulación de pasarela de pago
    await new Promise(r => setTimeout(r, 1800))

    const { error: insertError } = await supabase
      .from('purchases')
      .insert({
        user_id: profile.id,
        route_id: id,
        payment_status: 'simulado_pagado',
      })

    if (insertError) {
      setError('Error al procesar el pago. Es posible que ya hayas comprado esta ruta.')
      setPaying(false)
      return
    }

    setHasPurchased(true)
    setJustPaid(true)
    setPaying(false)
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

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
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
          {/* Contenido */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl text-sand-900 mb-4">Sobre esta ruta</h2>
            <p className="text-sand-700 leading-relaxed whitespace-pre-line">{route.description}</p>

            {hasPurchased && (
              <div className="mt-8 space-y-4">
                <div className="p-5 rounded-xl bg-forest-50 border border-forest-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-forest-600" />
                    <h3 className="font-serif text-lg text-forest-800">Contenido desbloqueado</h3>
                  </div>
                  <p className="text-sm text-forest-700 mb-4">Ya puedes descargar los archivos y abrir el mapa.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {route.gpx_url && (
                      <a href={route.gpx_url} download className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        <Download className="w-6 h-6 text-forest-600" />
                        <span className="text-sm font-medium text-sand-800">GPX</span>
                      </a>
                    )}
                    {route.pdf_url && (
                      <a href={route.pdf_url} download className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-forest-200 hover:border-forest-400 transition-all">
                        <FileText className="w-6 h-6 text-forest-600" />
                        <span className="text-sm font-medium text-sand-800">PDF</span>
                      </a>
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

          {/* Sidebar de compra */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <div className="card p-6">
                {hasPurchased ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-forest-50 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-forest-600" />
                      </div>
                      <p className="font-serif text-xl text-sand-900">Ruta comprada</p>
                      <p className="text-sm text-sand-500 mt-1">Precio: {route.price}€</p>
                    </div>
                    {justPaid && (
                      <div className="mb-4 p-3 rounded-lg bg-forest-50 border border-forest-200 text-forest-700 text-sm text-center animate-fade-in">
                        ¡Pago completado! Ya puedes descargar todo el contenido.
                      </div>
                    )}
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
                    <p className="text-sm text-sand-500 mb-6">Pago único · Acceso permanente</p>

                    {!profile && (
                      <div className="mb-4 p-3 rounded-lg bg-sand-100 border border-sand-200 text-sand-700 text-sm text-center">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Inicia sesión para comprar
                      </div>
                    )}

                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handlePay}
                      disabled={paying || !profile || profile.status !== 'aprobado'}
                      className="w-full btn-primary flex items-center justify-center gap-2 mb-3"
                    >
                      {paying ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Procesando pago...</>
                      ) : (
                        <><CreditCard className="w-5 h-5" /> Pagar y Descargar</>
                      )}
                    </button>

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
                        Pasarela en modo prueba — no se realiza ningún cargo real.
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
