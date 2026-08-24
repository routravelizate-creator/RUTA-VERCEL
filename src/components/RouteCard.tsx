import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import type { Route } from '../lib/supabase'

export function RouteCard({ route }: { route: Route }) {
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
        <div className="mt-4 flex items-center gap-2 text-forest-600 text-sm font-medium group-hover:gap-3 transition-all">
          Ver ruta <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
