import { useEffect, useState } from 'react'
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Loader as Loader2, Mail, User } from 'lucide-react'
import { supabase, Profile } from '../../lib/supabase'

export function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pendiente' | 'aprobado' | 'rechazado' | 'todos'>('pendiente')
  const [acting, setActing] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (filter !== 'todos') query = query.eq('status', filter)
    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [filter])

  const updateStatus = async (userId: string, status: 'aprobado' | 'rechazado') => {
    setActing(userId)
    const { error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: userId,
      p_status: status,
    })

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
    }
    setActing(null)
  }

  const statusBadge = (status: string) => {
    if (status === 'aprobado') return <span className="px-2.5 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Aprobado</span>
    if (status === 'pendiente') return <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pendiente</span>
    if (status === 'rechazado') return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rechazado</span>
    return null
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pendiente', 'aprobado', 'rechazado', 'todos'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-forest-600 text-white'
                : 'bg-white text-sand-600 border border-sand-200 hover:bg-sand-50'
            }`}
          >
            {f === 'todos' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-forest-600" /></div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-10 h-10 text-sand-300 mx-auto mb-3" />
          <p className="text-sand-500">No hay usuarios en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sand-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-sand-400" />
                </div>
                <div>
                  <p className="font-medium text-sand-900">{user.full_name || 'Sin nombre'}</p>
                  <p className="text-sm text-sand-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {user.email}
                  </p>
                  <div className="mt-1">{statusBadge(user.status)}</div>
                </div>
              </div>

              {user.status === 'pendiente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(user.id, 'aprobado')}
                    disabled={acting === user.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 transition-all disabled:opacity-50"
                  >
                    {acting === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Aprobar
                  </button>
                  <button
                    onClick={() => updateStatus(user.id, 'rechazado')}
                    disabled={acting === user.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              )}

              {user.status === 'rechazado' && (
                <button
                  onClick={() => updateStatus(user.id, 'aprobado')}
                  disabled={acting === user.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-50 text-forest-700 border border-forest-200 text-sm font-medium hover:bg-forest-100 transition-all disabled:opacity-50"
                >
                  {acting === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Reactivar
                </button>
              )}

              {user.status === 'aprobado' && (
                <button
                  onClick={() => updateStatus(user.id, 'rechazado')}
                  disabled={acting === user.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Bloquear
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
