import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, Loader as Loader2, CircleCheck as CheckCircle, Clock, Circle as XCircle, Bell, MapPin, Star, Calendar, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

interface AccountModalProps {
  onClose: () => void
  onSignOut: () => void
}

export function AccountModal({ onClose, onSignOut }: AccountModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'success'>('login')
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          setNotifications(data || [])
          setUnreadCount((data || []).filter((n: any) => !n.is_read).length)
        })
    }
  }, [profile])

  const markAllRead = async () => {
    if (!profile) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', data.user!.id)
      .maybeSingle()

    if (profileData?.status === 'pendiente') {
      setError('Tu cuenta está pendiente de aprobación por el administrador.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (profileData?.status === 'rechazado') {
      setError('Tu cuenta ha sido rechazada. Contacta con el administrador.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (profileData?.role === 'admin') {
      navigate('/admin')
      onClose()
      return
    }

    await refreshProfile()
    onClose()
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (email !== emailConfirm) {
      setError('Los emails no coinciden.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (!firstName.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate,
          avatar_url: avatarUrl.trim(),
        },
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este email ya está registrado.'
        : error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setMode('success')
    }
    setLoading(false)
  }

  // --- Usuario ya autenticado ---
  if (profile) {
    return (
      <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden animate-slide-down z-50">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-forest-600" />
                </div>
              )}
              <div>
                <p className="text-xs text-sand-500 uppercase tracking-wide">Mi cuenta</p>
                <p className="font-serif text-lg text-sand-900 mt-0.5">
                  {profile.full_name || 'Viajero'} {profile.last_name || ''}
                </p>
                <p className="text-sm text-sand-600">{profile.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-sand-400 hover:text-sand-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Valoración del usuario */}
          {profile.rating_count > 0 && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {Number(profile.rating_avg).toFixed(1)} ({profile.rating_count} reseñas)
              </span>
            </div>
          )}

          <div className={`px-4 py-3 rounded-xl mb-4 flex items-center gap-3 ${
            profile.status === 'aprobado'
              ? 'bg-forest-50 text-forest-700 border border-forest-200'
              : profile.status === 'pendiente'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {profile.status === 'aprobado' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {profile.status === 'pendiente' && <Clock className="w-5 h-5 flex-shrink-0" />}
            {profile.status === 'rechazado' && <XCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">
              {profile.status === 'aprobado' && 'Cuenta aprobada'}
              {profile.status === 'pendiente' && 'Pendiente de aprobación'}
              {profile.status === 'rechazado' && 'Cuenta rechazada'}
            </span>
          </div>

          {/* Notificaciones */}
          <button
            onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead() }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-sand-50 hover:bg-sand-100 transition-colors mb-3"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sand-600" />
              <span className="text-sm font-medium text-sand-700">Notificaciones</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-sand-400 text-center py-3">No tienes notificaciones</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg border text-sm ${
                    n.is_read ? 'bg-white border-sand-200' : 'bg-forest-50 border-forest-200'
                  }`}>
                    <p className="font-medium text-sand-800">{n.title}</p>
                    <p className="text-sand-600 text-xs mt-0.5">{n.message}</p>
                    <p className="text-sand-400 text-xs mt-1">
                      {new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {profile.status === 'aprobado' && (
            <>
              <button
                onClick={() => { onClose(); navigate('/mis-rutas') }}
                className="w-full btn-primary text-sm mb-2 flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Ver mis rutas compradas
              </button>
              {(profile.role === 'routraveler' || profile.role === 'admin') && (
                <button
                  onClick={() => { onClose(); navigate('/publicar') }}
                  className="w-full btn-secondary text-sm mb-2"
                >
                  Publicar una ruta
                </button>
              )}
            </>
          )}

          <button
            onClick={onSignOut}
            className="w-full btn-secondary text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // --- Registro completado ---
  if (mode === 'success') {
    return (
      <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden animate-slide-down z-50">
        <div className="p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-sand-400 hover:text-sand-600">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-forest-600" />
          </div>
          <h3 className="font-serif text-xl text-sand-900 mb-2">¡Cuenta creada!</h3>
          <p className="text-sm text-sand-600 leading-relaxed">
            Tu cuenta ya está activa. Ya puedes explorar y comprar rutas. ¡Bienvenido a Routravel!
          </p>
          <button onClick={onClose} className="mt-5 w-full btn-primary text-sm">
            Empezar a explorar
          </button>
        </div>
      </div>
    )
  }

  // --- Formulario de login o registro ---
  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden animate-slide-down z-50 max-h-[85vh] overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-sand-900">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h3>
          <button onClick={onClose} className="text-sand-400 hover:text-sand-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field pl-10 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input
                type="password"
                required
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pl-10 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar
            </button>
            <p className="text-center text-sm text-sand-600 pt-1">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError('') }}
                className="text-forest-600 font-medium hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-sand-500 mb-1 block">Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="María"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-sand-500 mb-1 block">Apellidos</label>
                <input
                  type="text"
                  placeholder="González López"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha de nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block flex items-center gap-1"><Camera className="w-3 h-3" /> URL foto de perfil (opcional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block">Repetir email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={emailConfirm}
                  onChange={e => setEmailConfirm(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block">Contraseña (mín. 6 caracteres) *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-sand-500 mb-1 block">Repetir contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear cuenta
            </button>
            <p className="text-center text-sm text-sand-600 pt-1">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="text-forest-600 font-medium hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
