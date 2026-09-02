import { useEffect, useState } from 'react'
import { Plus, Loader as Loader2, Trash2, X, Save, FileText, CreditCard as Edit, Lock } from 'lucide-react'
import { supabase, BlogPost } from '../../lib/supabase'
import { RichTextEditor } from '../RichTextEditor'
import { useAuth } from '../../context/AuthContext'

export function AdminBlog() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin' && profile?.status === 'aprobado'
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    is_published: false,
  })

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const resetForm = () => {
    setForm({ title: '', excerpt: '', content: '', image_url: '', is_published: false })
    setEditingPost(null)
  }

  const openNew = () => { resetForm(); setShowForm(true) }

  const openEdit = (post: BlogPost) => {
    if (!isAdmin && post.author_id && post.author_id !== profile?.id) return
    setEditingPost(post)
    setForm({ title: post.title, excerpt: post.excerpt, content: post.content, image_url: post.image_url, is_published: post.is_published })
    setShowForm(true)
  }

  const canEdit = (post: BlogPost) => isAdmin || !post.author_id || post.author_id === profile?.id

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      image_url: form.image_url,
      is_published: form.is_published,
    }

    if (editingPost) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', editingPost.id)
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.from('blog_posts').insert(payload)
      if (error) setError(error.message)
    }

    if (!error) { setShowForm(false); resetForm(); fetchPosts() }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este artículo?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    fetchPosts()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-sand-900">Gestión del blog</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 transition-all">
          <Plus className="w-4 h-4" /> Nuevo artículo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-forest-600" /></div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-sand-300 mx-auto mb-3" />
          <p className="text-sand-500 mb-4">No hay artículos todavía.</p>
          <button onClick={openNew} className="btn-primary text-sm">Crear el primer artículo</button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center overflow-hidden">
                  {post.image_url ? <img src={post.image_url} alt="" className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-sand-400" />}
                </div>
                <div>
                  <p className="font-medium text-sand-900">{post.title}</p>
                  <p className="text-sm text-sand-500">{new Date(post.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {post.is_published ? (
                  <span className="px-2.5 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-medium">Publicado</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-sand-200 text-sand-700 text-xs font-medium">Borrador</span>
                )}
                {canEdit(post) ? (
                  <>
                    <button onClick={() => openEdit(post)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sand-100 text-sand-700 text-sm hover:bg-sand-200 transition-all">
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-2 text-xs text-sand-400">
                    <Lock className="w-3 h-3" /> Solo lectura
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-sand-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-sand-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-serif text-xl text-sand-900">{editingPost ? 'Editar artículo' : 'Nuevo artículo'}</h3>
              <button onClick={() => setShowForm(false)} className="text-sand-400 hover:text-sand-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Título *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Título del artículo" />
              </div>
              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Resumen *</label>
                <textarea required rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="input-field" placeholder="Breve resumen del artículo..." />
              </div>
              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">Contenido *</label>
                <RichTextEditor
                  value={form.content}
                  onChange={val => setForm({ ...form, content: val })}
                  placeholder="Escribe el artículo de viaje..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-sand-700 mb-1 block">URL de la imagen *</label>
                <input required value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-5 h-5 rounded accent-forest-600" />
                <span className="text-sm text-sand-700">Publicar (visible para los usuarios)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> {editingPost ? 'Guardar cambios' : 'Crear artículo'}</>}
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
