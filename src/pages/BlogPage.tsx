import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, Loader as Loader2 } from 'lucide-react'
import { supabase, BlogPost } from '../lib/supabase'

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-forest-600 text-sm uppercase tracking-widest font-medium mb-2">Routravel / Blog</p>
          <h1 className="font-serif text-4xl md:text-5xl text-sand-900 mb-3">Historias de viaje</h1>
          <p className="text-sand-600 max-w-xl mx-auto">Crónicas, consejos y experiencias de la comunidad Routravel.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-sand-500 text-lg">Todavía no hay artículos publicados. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.id}`} className="block card overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-sand-500 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h2 className="font-serif text-2xl text-sand-900 mb-2 group-hover:text-forest-600 transition-colors">{post.title}</h2>
                  <p className="text-sand-600 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-2 text-forest-600 font-medium text-sm group-hover:gap-3 transition-all">
                    Leer más <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
