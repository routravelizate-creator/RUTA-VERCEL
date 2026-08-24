import { useEffect, useState } from 'react'
import { Plus, Loader as Loader2, CreditCard as Edit, Trash2, X, MapPin, Upload, FileText, Link2, Save } from 'lucide-react'
import { supabase, Route } from '../../lib/supabase'

export function AdminRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    price: '0',
    gpx_url: '',
    pdf_url: '',
    mymaps_url: '',
    is_published: false,
  })

  const fetchRoutes = async () => {
    setLoading(true)
    const { data } = await supabase.from('routes').select('*').order('created_at', { ascending: false })
    setRoutes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRoutes() }, [])

  const resetForm = () => {
    setForm({ title: '', subtitle: '', description: '', image_url: '', price: '0', gpx_url: '', pdf_url: '', mymaps_url: '', is_published: false })
    setEditingRoute(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (route: Route) => {
    setEditingRoute(route)
    setForm({
      title: route.title,
      subtitle: route.subtitle,
      description: route.description,
      image_url: route.image_url,
      price: String(route.price),
      gpx_url: route.gpx_url || '',
      pdf_url: route.pdf_url || '',
      mymaps_url: route.mymaps_url || '',
      is_published: route.is_published,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      image_url: form.image_url,
      price: parseFloat(form.price) || 0,
      gpx_url: form.gpx_url || null,
      pdf_url: form.pdf_url || null,
      mymaps_url: form.mymaps_url || null,
      is_published: form.is_published,
    }

    if (editingRoute) {
      const { error } = await supabase.from('routes').update(payload).eq('id', editingRoute.id)
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.from('routes').insert(payload)
      if (error) setError(error.message)
    }

    if (!error) {
      setShowForm(false)
      resetForm()
      fetchRoutes()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta ruta?')) return
    await supabase.from('routes').delete().eq('id', id)
    fetchRoutes()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-sand-900">Gestión de rutas</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 transition-all">
          <Plus className="w-4 h-4" /> Nueva ruta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-forest-600" /></div>
      ) : routes.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-10 h-10 text-sand-300 mx-auto mb-3" />
          <p className="text-sand-500 mb-4">No hay rutas creadas todavía.</p>
          <button onClick={openNew} className="btn-primary text-sm">Crear la primera ruta</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map(route => (
            <div key={route.id} className="card overflow-hidden">
              <div className="relative h-40">
                <img src={route.image_url} alt={route.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  {route.is_published ? (
                    <span className="px-2 py-1 rounded-full bg-forest-600 text-white text-xs">Publicada</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-sand-200 text-sand-700 text-xs">Borrador</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg text-sand-900 mb-1">{route.title}</h3>
                <p className="text-sm text-sand-500 mb-3">{route.subtitle}</p>
                <div className="flex items-center gap-3 text-xs text-sand-500 mb-3">
                  <span>{route.price}€</span>
                  {route.gpx_url && <span>GPX ✓</span>}
                  {route.pdf_url && <span>PDF ✓</span>}
                  {route.mymaps_url && <span>Maps ✓</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(route)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-sand-100 text-sand-700 text-sm hover:bg-sand-200 transition-all">
                    <Edit className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => handleDelete(route.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-sand-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-sand-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-serif text-xl text-sand-900">
                {editingRoute ? 'Editar ruta' : 'Nueva ruta'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-sand-400 hover:text-sand-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Título *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="7 días por la costa de Galicia" />
              </div>

              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Subtítulo / Ruta *</label>
                <input required value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="input-field" placeholder="Vigo → Costa da Morte" />
              </div>

              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Descripción *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Descripción detallada de la ruta..." />
              </div>

              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">URL de la imagen *</label>
                <input required value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." />
              </div>

              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Precio (€)</label>
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

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> {editingRoute ? 'Guardar cambios' : 'Crear ruta'}</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
