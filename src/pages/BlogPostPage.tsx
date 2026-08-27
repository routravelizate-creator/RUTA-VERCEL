import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, Loader as Loader2 } from 'lucide-react'
import { supabase, BlogPost } from '../lib/supabase'
import { MarkdownContent } from '../components/RichTextEditor'

export function BlogPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPost(data as BlogPost)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
        <p className="text-sand-600">Artículo no encontrado.</p>
        <Link to="/blog" className="btn-primary">Volver al blog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-sand-500 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-sand-900 mb-4">{post.title}</h1>
          <p className="text-lg text-sand-600 leading-relaxed">{post.excerpt}</p>
        </div>

        <div className="rounded-2xl overflow-hidden mb-8">
          <img src={post.image_url} alt={post.title} className="w-full h-80 object-cover" />
        </div>

        <div className="prose prose-lg max-w-none">
          <MarkdownContent content={post.content} />
        </div>
      </div>
    </div>
  )
}
