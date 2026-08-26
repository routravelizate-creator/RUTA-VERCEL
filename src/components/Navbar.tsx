import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, CircleUser as UserCircle, LogOut, MapPin, CircleCheck as CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AccountModal } from './AccountModal'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    if (accountOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [accountOpen])

  const handleSignOut = async () => {
    await signOut()
    setAccountOpen(false)
    navigate('/')
  }

  const navLinks = [
    { label: 'Rutas', href: '/#rutas' },
    { label: 'Formato', href: '/#formato' },
    { label: 'Comunidad', href: '/#comunidad' },
    { label: 'Blog', href: '/blog' },
    { label: 'Routraveler', href: '/#routraveler' },
  ]

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-sand-50/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <MapPin className="w-7 h-7 text-forest-600 group-hover:scale-110 transition-transform" />
            <span className={`font-serif text-2xl font-bold tracking-tight ${
              scrolled ? 'text-sand-900' : 'text-sand-900'
            }`}>
              Routravel
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                className={`text-sm font-medium hover:text-forest-600 transition-colors ${
                  scrolled ? 'text-sand-700' : 'text-sand-800'
                }`}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={modalRef}>
              {profile ? (
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-forest-600 text-white hover:bg-forest-700 transition-all active:scale-95"
                >
                  {profile.status === 'aprobado' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">
                    {profile.full_name || profile.email.split('@')[0]}
                  </span>
                  <UserCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-sand-300 hover:bg-sand-100 transition-all active:scale-95"
                >
                  <UserCircle className="w-5 h-5 text-sand-700" />
                  <span className="text-sm font-medium text-sand-800 hidden sm:inline">Mi cuenta</span>
                </button>
              )}

              {accountOpen && (
                <AccountModal
                  onClose={() => setAccountOpen(false)}
                  onSignOut={handleSignOut}
                />
              )}
            </div>

            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="md:hidden bg-sand-50 border-t border-sand-200 animate-slide-down">
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map(link => (
                <a key={link.href} href={link.href}
                  className="text-sand-700 font-medium hover:text-forest-600"
                  onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}
