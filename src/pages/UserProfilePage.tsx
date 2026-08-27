import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, MapPin, ArrowLeft, Loader as Loader2, Calendar } from 'lucide-react'
import { supabase, Profile, Route, Review } from '../lib/supabase'
import { RouteCard } from '../components/RouteCard'

export function UserProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('routes').select('*').eq('author_id', id).eq('is_published', true),
      supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviewer_id(*)')
        .in('route_id',
          (routes.length > 0 ? routes.map(r => r.id) : ['00000000-0000-0000-0000-000000000000'])
        )
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([profileRes, routesRes, reviewsRes]) => {
      setProfile(profileRes.data as Profile | null)
      setRoutes((routesRes.data || []) as Route[])
      if (routesRes.data && routesRes.data.length > 0) {
        const routeIds = (routesRes.data as Route[]).map(r => r.id)
        supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviewer_id(*)')
          .in('route_id', routeIds)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }) => setReviews((data as Review[]) || []))
      }
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
        <p className="text-sand-600">Usuario no encontrado.</p>
        <Link to="/" className="btn-primary">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        {/* Cabecera del perfil */}
        <div className="card p-8 mb-8">
          <div className="flex items-start gap-6 flex-wrap">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-forest-100 flex items-center justify-center shadow-md">
                <span className="font-serif text-3xl text-forest-600">
                  {(profile.full_name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-3xl text-sand-900 mb-1">
                {profile.full_name || 'Viajero'} {profile.last_name || ''}
              </h1>
              <p className="text-sm text-sand-500 mb-3">
                Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </p>

              {profile.rating_count > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= Math.round(Number(profile.rating_avg)) ? 'text-amber-500 fill-amber-500' : 'text-sand-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-sand-600 font-medium">
                    {Number(profile.rating_avg).toFixed(1)} · {profile.rating_count} reseñas
                  </span>
                </div>
              )}

              {profile.bio && (
                <p className="text-sand-600 text-sm leading-relaxed mt-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rutas creadas */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl text-sand-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-forest-600" />
            Rutas publicadas ({routes.length})
          </h2>
          {routes.length === 0 ? (
            <p className="text-sand-500 text-sm">Este usuario aún no ha publicado rutas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map(route => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </div>

        {/* Reseñas recibidas */}
        {reviews.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl text-sand-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Reseñas de sus rutas
            </h2>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {review.reviewer?.avatar_url ? (
                        <img src={review.reviewer.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center">
                          <span className="font-serif text-sm text-sand-600">
                            {(review.reviewer?.full_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sand-900 text-sm">
                          {review.reviewer?.full_name || 'Anónimo'} {review.reviewer?.last_name || ''}
                        </p>
                        <p className="text-xs text-sand-400">
                          {new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-sand-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-sand-600 leading-relaxed mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
