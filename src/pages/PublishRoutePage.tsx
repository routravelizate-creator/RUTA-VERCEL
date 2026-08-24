import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader as Loader2, Save, Upload, FileText, Link2, MapPin, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function PublishRoutePage() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    price: '10',
    gpx_url: '',
    pdf_url: '',
    mymaps_url: '',
    is_published: false,
  })

  useEffect(() => {
    if (!authLoading && (!profile || profile.status !== 'aprobado' || profile.role !== 'routraveler')) {
      navigate('/')
    }
  }, [profile, authLoading, navigate])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error } = await supabase.from('routes').insert({
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      image_url: form.image_url,
      price: parseFloat(form.price) || 0,
      gpx_url: form.gpx_url || null,
      pdf_url: form.pdf_url || null,
      mymaps_url: form.mymaps_url || null,
      is_published: form.is_published,
      author_id: profile?.id || null,
    })

    if (error) {
      setError('No se pudo publicar la ruta. Inténtalo de nuevo.')
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => navigate('/'), 2000)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="font-serif text-2xl text-sand-900 mb-2">Ruta publicada</h2>
          <p className="text-sand-600">Tu ruta se ha creado correctamente. Te redirigimos a la página principal...</p>
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

        <h1 className="font-serif text-3xl text-sand-900 mb-2">Publicar una ruta</h1>
        <p className="text-sand-600 mb-8">Comparte tu ruta guiada con la comunidad Routravel.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Titulo *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="7 dias por la costa de Galicia" />
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Subtitulo / Ruta *</label>
            <input required value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="input-field" placeholder="Vigo - Costa da Morte" />
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Descripcion *</label>
            <textarea required rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Describe la ruta, los puntos de interes, duracion, dificultad..." />
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">URL de la imagen *</label>
            <input required value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." />
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Precio (EUR)</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" />
          </div>

          <div className="border-t border-sand-200 pt-4 space-y-4">
            <p className="text-sm font-medium text-sand-700 flex items-center gap-2"><Upload className="w-4 h-4" /> Archivos descargables (URLs)</p>

            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> URL del archivo GPX</label>
              <input value={form.gpx_url} onChange={e => setForm({ ...form, gpx_url: e.target.value })} className="input-field" placeholder="https://...gpx" />
            </div>
            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> URL del archivo PDF</label>
              <input value={form.pdf_url} onChange={e => setForm({ ...form, pdf_url: e.target.value })} className="input-field" placeholder="https://...pdf" />
            </div>
            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><Link2 className="w-3 h-3" /> URL de Google My Maps (embed)</label>
              <input value={form.mymaps_url} onChange={e => setForm({ ...form, mymaps_url: e.target.value })} className="input-field" placeholder="https://www.google.com/maps/d/..." />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-5 h-5 rounded accent-forest-600" />
            <span className="text-sm text-sand-700">Publicar ruta (visible para los usuarios)</span>
          </label>

          <button type="submit" disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Publicar ruta</>}
          </button>
        </form>
      </div>
    </div>
  )
}
