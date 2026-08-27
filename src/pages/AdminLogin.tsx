import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Loader as Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas.')
      setLoading(false)
      return
    }

    // Verificar que es admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user!.id)
      .maybeSingle()

    if (!profileData || (profileData.role !== 'admin' && profileData.role !== 'editor')) {
      setError('No tienes permisos para acceder al panel.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (profileData.status !== 'aprobado') {
      setError('Tu cuenta de administrador no está aprobada.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    await refreshProfile()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-900 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-600 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl text-sand-50">Panel de administración</h1>
          <p className="text-sand-400 text-sm mt-2">Acceso exclusivo para gestores</p>
        </div>

        <div className="bg-sand-50 rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-sand-700 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin@routravel.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-sand-700 mb-1 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acceder al panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-sand-500 text-xs mt-6">
          Zona restringida · Solo personal autorizado
        </p>
      </div>
    </div>
  )
}
