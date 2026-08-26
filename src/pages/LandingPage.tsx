import { useEffect, useState } from 'react'
import { MapPin, FileText, Navigation, Users, Compass, Download, ArrowRight } from 'lucide-react'
import { supabase, Route } from '../lib/supabase'
import { RouteCard } from '../components/RouteCard'

export function LandingPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('routes')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRoutes(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534938665420-4193effeabd4?auto=format&fit=crop&q=80&w=1920"
            alt="Costa de Galicia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-sand-900/40 via-sand-900/30 to-sand-50/90" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl animate-fade-in">
          <p className="text-sand-100 text-sm uppercase tracking-widest mb-4 font-medium">
            Mapas reales, hechos por gente que viaja dos veces
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 leading-tight font-bold">
            Viaja con una buena historia.
          </h1>
          <p className="text-sand-100 text-lg md:text-xl mb-8 leading-relaxed max-w-2xl mx-auto">
            Rutas descargables, puntos con criterio y el camino exacto para llegar a ellos.
            La mirada de alguien que ya estuvo allí, lista para abrir en Google Maps.
          </p>
          <a href="#rutas" className="inline-flex items-center gap-2 px-8 py-4 bg-forest-600 text-white rounded-full font-medium hover:bg-forest-700 transition-all active:scale-95 shadow-lg">
            Ver rutas <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Stats reales */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 gap-6 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <p className="font-serif text-3xl md:text-4xl text-sand-900 font-bold">{routes.length}</p>
                <p className="text-xs md:text-sm text-sand-500 mt-1">rutas publicadas</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-3xl md:text-4xl text-sand-900 font-bold">100%</p>
                <p className="text-xs md:text-sm text-sand-500 mt-1">hechas por viajeros</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMATO */}
      <section id="formato" className="py-24 bg-sand-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-forest-600 text-sm uppercase tracking-widest font-medium mb-2">routravel / field notes / 004</p>
            <h2 className="font-serif text-4xl md:text-5xl text-sand-900 mb-4">El formato</h2>
            <p className="font-serif text-2xl text-sand-700">Del mapa a tu bolsillo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Compass, num: '01', title: 'Encuentra una mirada', desc: 'Explora rutas con un estilo de viaje real detrás, no un algoritmo de likes.' },
              { icon: MapPin, num: '02', title: 'Abre el mapa', desc: 'Puntos exactos, horarios y observaciones, listo para abrir en Google Maps.' },
              { icon: Navigation, num: '03', title: 'Sal a rodar', desc: 'Descarga el GPX y el PDF del itinerario y arranca el coche.' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-forest-50 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                  <step.icon className="w-8 h-8 text-forest-600" />
                </div>
                <p className="text-sand-400 font-serif text-2xl mb-2">{step.num}</p>
                <h3 className="font-serif text-xl text-sand-900 mb-3">{step.title}</h3>
                <p className="text-sand-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RUTAS */}
      <section id="rutas" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-forest-600 text-sm uppercase tracking-widest font-medium mb-2">La selección de la semana</p>
            <h2 className="font-serif text-4xl md:text-5xl text-sand-900">Rutas para salirse del camino marcado</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="card animate-pulse">
                  <div className="h-56 bg-sand-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-sand-200 rounded w-3/4" />
                    <div className="h-4 bg-sand-200 rounded w-1/2" />
                    <div className="h-4 bg-sand-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {routes.map(route => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sand-500">Aún no hay rutas publicadas. ¡Vuelve pronto!</p>
            </div>
          )}
        </div>
      </section>

      {/* COMUNIDAD */}
      <section id="comunidad" className="py-24 bg-sand-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-forest-600 text-sm uppercase tracking-widest font-medium mb-2">Comunidad</p>
              <h2 className="font-serif text-4xl text-sand-900 mb-6 leading-tight">
                No es solo un mapa, es a quién te vas a cruzar por el camino.
              </h2>
              <p className="text-sand-600 leading-relaxed mb-6">
                Conecta con quien compró tu mismo itinerario, o con otros roadtrippers que estarán cerca en tus fechas.
              </p>
              <div className="flex items-center gap-3 text-sand-700">
                <Users className="w-5 h-5 text-forest-600" />
                <span className="text-sm font-medium">Únete a la comunidad y comparte tus rutas</span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=900"
                alt="Viajeros en ruta"
                className="rounded-2xl shadow-xl w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ROUTRAVELER */}
      <section id="routraveler" className="py-24 bg-forest-700 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-forest-300 text-sm uppercase tracking-widest font-medium mb-2">Programa Routraveler</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">¿Conoces una ruta mejor que la nuestra? Publícala.</h2>
          <p className="text-forest-100 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Sube tu itinerario, tus puntos GPS y tus entradas favoritas. Se genera al momento un GPX y un PDF descargables.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-forest-200">
              <Download className="w-5 h-5" /> GPX descargable
            </div>
            <div className="flex items-center gap-2 text-forest-200">
              <FileText className="w-5 h-5" /> PDF del itinerario
            </div>
            <div className="flex items-center gap-2 text-forest-200">
              <MapPin className="w-5 h-5" /> Google My Maps
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
