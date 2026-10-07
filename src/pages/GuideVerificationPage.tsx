import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader as Loader2, ArrowLeft, CircleCheck as CheckCircle, Mail, Compass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function GuideVerificationPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    doc_type: 'ruta_ejemplo',
    doc_description: '',
    doc_url: '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/guide-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: profile?.id,
          ...form,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Error al enviar la solicitud')
      }

      setSuccess(true)
      setSaving(false)
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud')
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="font-serif text-2xl text-sand-900 mb-2">Solicitud enviada</h2>
          <p className="text-sand-600 mb-6">Hemos recibido tu solicitud. Revisaremos tu ruta de ejemplo y te responderemos lo antes posible.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Volver al inicio</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center">
              <Compass className="w-6 h-6 text-forest-600" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-sand-900">Ser Routraveler</h1>
              <p className="text-sand-600 text-sm">Publica tus rutas y gana dinero con ellas</p>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6 bg-forest-50 border-forest-200">
          <p className="text-sm text-forest-700 leading-relaxed">
            Como Routraveler puedes publicar tus rutas de viaje en Routravel y ganar dinero con cada venta. Te quedas con el 80% de cada venta y nosotros nos encargamos de los pagos y la plataforma.
          </p>
          <p className="mt-3 text-sm text-forest-700 leading-relaxed">
            Para empezar, necesitamos ver una ruta de ejemplo. Crea un mapa en Google My Maps con los puntos de una ruta que conozcas bien y compártenos el enlace.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Nombre completo *</label>
            <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="Tu nombre completo" />
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field pl-10" placeholder="tu@email.com" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Tipo de ruta *</label>
            <select required value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })} className="input-field">
              <option value="ruta_ejemplo">Ruta en coche</option>
              <option value="ruta_senderismo">Ruta de senderismo</option>
              <option value="ruta_bici">Ruta en bicicleta</option>
              <option value="ruta_moto">Ruta en moto</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Cuéntanos sobre tu ruta *</label>
            <textarea required rows={3} value={form.doc_description} onChange={e => setForm({ ...form, doc_description: e.target.value })} className="input-field" placeholder="¿Qué zona cubre? ¿Cuántos puntos tiene? ¿Por qué merece la pena?" />
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Enlace a tu mapa (Google My Maps) *</label>
            <input required value={form.doc_url} onChange={e => setForm({ ...form, doc_url: e.target.value })} className="input-field" placeholder="https://www.google.com/maps/d/..." />
            <p className="text-xs text-sand-500 mt-1">Crea un mapa en Google My Maps con los puntos de tu ruta y compártenos el enlace público.</p>
          </div>

          <button type="submit" disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Enviar solicitud</>}
          </button>
        </form>
      </div>
    </div>
  )
}
