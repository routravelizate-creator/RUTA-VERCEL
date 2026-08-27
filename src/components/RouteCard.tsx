import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPin, ArrowRight, Star } from 'lucide-react'
import { supabase, Route, Profile } from '../lib/supabase'

export function RouteCard({ route }: { route: Route }) {
  const [author, setAuthor] = useState<Profile | null>(null)

  useEffect(() => {
    if (route.author_id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', route.author_id)
        .maybeSingle()
        .then(({ data }) => setAuthor(data as Profile | null))
    }
  }, [route.author_id])

  return (
    <Link to={`/ruta/${route.id}`} className="card group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <div className="relative h-56 overflow-hidden">
        <img
          src={route.image_url}
          alt={route.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full">
          <span className="text-sm font-semibold text-sand-900">
            {route.price === 0 ? 'Gratis' : `${route.price}€`}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl text-sand-900 mb-1 group-hover:text-forest-600 transition-colors">
          {route.title}
        </h3>
        <p className="text-sm text-sand-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {route.subtitle}
        </p>
        <p className="text-sm text-sand-600 line-clamp-2">{route.description}</p>

        {author && (
          <div className="mt-4 pt-3 border-t border-sand-100 flex items-center justify-between">
            <Link
              to={`/usuario/${author.id}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-2 group/author"
            >
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-sand-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-sand-600">
                    {(author.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-sand-600 group-hover/author:text-forest-600 transition-colors">
                {author.full_name} {author.last_name}
              </span>
            </Link>
            {author.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs text-sand-500">{Number(author.rating_avg).toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-forest-600 text-sm font-medium group-hover:gap-3 transition-all">
          Ver ruta <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
