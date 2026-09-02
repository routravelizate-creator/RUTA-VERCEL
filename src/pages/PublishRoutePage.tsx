import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader as Loader2, Save, Upload, FileText, Link2, MapPin, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { supabase, Waypoint } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function PublishRoutePage() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [routeId, setRouteId] = useState<string | null>(null)

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

  const [waypoints, setWaypoints] = useState<{ name: string; description: string; lat: string; lng: string }[]>([])
  const [uploadingGpx, setUploadingGpx] = useState(false)
  const [gpxFileName, setGpxFileName] = useState('')

  useEffect(() => {
    if (!authLoading && (!profile || profile.status !== 'aprobado' || profile.role !== 'routraveler')) {
      navigate('/')
    }
  }, [profile, authLoading, navigate])

  const addWaypoint = () => {
    setWaypoints([...waypoints, { name: '', description: '', lat: '', lng: '' }])
  }

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index))
  }

  const updateWaypoint = (index: number, field: 'name' | 'description' | 'lat' | 'lng', value: string) => {
    const updated = [...waypoints]
    updated[index][field] = value
    setWaypoints(updated)
  }

  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingGpx(true)
    try {
      const fileName = `${profile?.id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('route-files')
        .upload(fileName, file, { contentType: 'application/gpx+xml' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('route-files')
        .getPublicUrl(fileName)

      setForm({ ...form, gpx_url: urlData.publicUrl })
      setGpxFileName(file.name)
    } catch {
      setError('No se pudo subir el archivo GPX.')
    }
    setUploadingGpx(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: routeData, error: insertError } = await supabase.from('routes').insert({
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
    }).select('id').single()

    if (insertError || !routeData) {
      setError('No se pudo publicar la ruta. Intentalo de nuevo.')
      setSaving(false)
      return
    }

    setRouteId(routeData.id)

    // Save waypoints
    if (waypoints.length > 0) {
      const wpData = waypoints
        .filter(wp => wp.name.trim() || wp.lat)
        .map((wp, i) => ({
          route_id: routeData.id,
          name: wp.name || `Punto ${i + 1}`,
          description: wp.description || null,
          lat: wp.lat ? parseFloat(wp.lat) : null,
          lng: wp.lng ? parseFloat(wp.lng) : null,
          ord: i,
        }))

      if (wpData.length > 0) {
        await supabase.from('route_waypoints').insert(wpData)
      }
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => navigate(`/ruta/${routeData.id}`), 2000)
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
          <p className="text-sand-600">Tu ruta se ha creado correctamente. Te redirigimos a la pagina de la ruta...</p>
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

          {/* Puntos de interes */}
          <div className="border-t border-sand-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-sand-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Puntos de interes
              </p>
              <button type="button" onClick={addWaypoint} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-50 text-forest-700 text-xs font-medium hover:bg-forest-100 transition-all">
                <Plus className="w-3 h-3" /> Anadir punto
              </button>
            </div>
            <p className="text-xs text-sand-500">Anade los puntos de interes de tu ruta. Si no subes un GPX manual, se generara uno automaticamente a partir de estos puntos. Tambien se usaran para crear el PDF del itinerario.</p>

            {waypoints.map((wp, i) => (
              <div key={i} className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm font-medium text-sand-700">Punto {i + 1}</span>
                  </div>
                  <button type="button" onClick={() => removeWaypoint(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <input value={wp.name} onChange={e => updateWaypoint(i, 'name', e.target.value)} className="input-field text-sm" placeholder="Nombre del punto (ej. Faro de Fisterra)" />
                </div>
                <div>
                  <textarea value={wp.description} onChange={e => updateWaypoint(i, 'description', e.target.value)} rows={2} className="input-field text-sm" placeholder="Descripcion breve (horarios, observaciones, que ver...)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={wp.lat} onChange={e => updateWaypoint(i, 'lat', e.target.value)} className="input-field text-sm font-mono" placeholder="Latitud (ej. 42.897)" />
                  <input value={wp.lng} onChange={e => updateWaypoint(i, 'lng', e.target.value)} className="input-field text-sm font-mono" placeholder="Longitud (ej. -9.265)" />
                </div>
                <p className="text-xs text-sand-400">Puedes obtener las coordenadas de Google Maps (boton derecho &gt; "Que hay aqui" &gt; copiar coordenadas).</p>
              </div>
            ))}

            {waypoints.length === 0 && (
              <div className="text-center py-6 text-sand-400 text-sm">
                No hay puntos de interes. Anadelos para que se genere el GPX y el PDF automaticamente.
              </div>
            )}
          </div>

          {/* Archivos descargables */}
          <div className="border-t border-sand-200 pt-4 space-y-4">
            <p className="text-sm font-medium text-sand-700 flex items-center gap-2"><Upload className="w-4 h-4" /> Archivos descargables</p>
            <p className="text-xs text-sand-500">Si no subes un GPX ni un PDF, se generaran automaticamente a partir de los puntos de interes.</p>

            {/* GPX upload */}
            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> Archivo GPX</label>
              <div className="flex gap-2">
                <input value={form.gpx_url} onChange={e => setForm({ ...form, gpx_url: e.target.value })} className="input-field flex-1" placeholder="https://...gpx (opcional)" />
                <label className="flex items-center gap-1 px-4 py-2 rounded-lg bg-forest-50 text-forest-700 text-sm font-medium hover:bg-forest-100 transition-all cursor-pointer whitespace-nowrap">
                  {uploadingGpx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {gpxFileName ? 'Cambiar' : 'Subir'}
                  <input type="file" accept=".gpx,application/gpx+xml" onChange={handleGpxUpload} className="hidden" />
                </label>
              </div>
              {gpxFileName && <p className="text-xs text-forest-600 mt-1">Archivo subido: {gpxFileName}</p>}
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> URL del PDF (opcional)</label>
              <input value={form.pdf_url} onChange={e => setForm({ ...form, pdf_url: e.target.value })} className="input-field" placeholder="https://...pdf (si no se pone, se genera automaticamente)" />
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
