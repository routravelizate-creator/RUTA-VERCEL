import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Loader as Loader2, CircleCheck as CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Supabase will set the session from the recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('El enlace no es válido o ha caducado.')
      }
    })
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('No se pudo cambiar la contraseña. ' + error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => navigate('/'), 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="font-serif text-2xl text-sand-900 mb-2">Contraseña cambiada</h2>
          <p className="text-sand-600">Tu contraseña se ha actualizado correctamente. Te redirigimos a la página principal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-md mx-auto px-6">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </button>

        <h1 className="font-serif text-3xl text-sand-900 mb-2">Cambiar contraseña</h1>
        <p className="text-sand-600 mb-8">Introduce tu nueva contraseña.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Nueva contraseña (mín. 6 caracteres)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="........"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-sand-700 mb-1 block">Repetir contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="........"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
