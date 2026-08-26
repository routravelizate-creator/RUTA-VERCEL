import { MapPin, Instagram, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-sand-900 text-sand-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-forest-400" />
              <span className="font-serif text-2xl font-bold">Routravel</span>
            </div>
            <p className="text-sand-300 text-sm leading-relaxed max-w-xs">
              Mapas reales, hechos por gente que viaja dos veces. Rutas descargables, puntos con criterio y el camino exacto para llegar a ellos.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-4 text-sand-200">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#rutas" className="text-sand-300 hover:text-white transition-colors">Rutas</a></li>
              <li><a href="/#formato" className="text-sand-300 hover:text-white transition-colors">Formato</a></li>
              <li><a href="/#comunidad" className="text-sand-300 hover:text-white transition-colors">Comunidad</a></li>
              <li><a href="/blog" className="text-sand-300 hover:text-white transition-colors">Blog</a></li>
              <li><a href="/#routraveler" className="text-sand-300 hover:text-white transition-colors">Programa Routraveler</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-4 text-sand-200">Contacto</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-sand-800 flex items-center justify-center hover:bg-forest-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-sand-800 flex items-center justify-center hover:bg-forest-600 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-800 text-center text-sm text-sand-400">
          <p>© {new Date().getFullYear()} Routravel. Mapas reales, hechos por gente que viaja dos veces.</p>
        </div>
      </div>
    </footer>
  )
}
