import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, Loader as Loader2, CircleCheck as CheckCircle, Clock, Circle as XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface AccountModalProps {
  onClose: () => void
  onSignOut: () => void
}

export function AccountModal({ onClose, onSignOut }: AccountModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'success'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

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

    // Verificar estado del perfil
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

    // Si es admin, redirigir al panel oculto
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
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden animate-slide-down z-50">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-sand-500 uppercase tracking-wide">Mi cuenta</p>
              <p className="font-serif text-lg text-sand-900 mt-1">{profile.full_name || 'Viajero'}</p>
              <p className="text-sm text-sand-600">{profile.email}</p>
            </div>
            <button onClick={onClose} className="text-sand-400 hover:text-sand-600">
              <X className="w-5 h-5" />
            </button>
          </div>

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

          {profile.status === 'aprobado' && (
            <button
              onClick={() => { onClose(); navigate('/mis-rutas') }}
              className="w-full btn-primary text-sm mb-2"
            >
              Ver mis rutas compradas
            </button>
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
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden animate-slide-down z-50">
        <div className="p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-sand-400 hover:text-sand-600">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-forest-600" />
          </div>
          <h3 className="font-serif text-xl text-sand-900 mb-2">Registro completado</h3>
          <p className="text-sm text-sand-600 leading-relaxed">
            Tu cuenta está pendiente de aprobación por el administrador.
            Te avisaremos cuando puedas acceder.
          </p>
          <button onClick={onClose} className="mt-5 w-full btn-primary text-sm">
            Entendido
          </button>
        </div>
      </div>
    )
  }

  // --- Formulario de login o registro ---
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden animate-slide-down z-50">
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
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-field pl-10 text-sm"
              />
            </div>
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
                minLength={6}
                placeholder="Contraseña (mín. 6 caracteres)"
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
              Registrarme
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
