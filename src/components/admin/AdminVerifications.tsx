import { useEffect, useState } from 'react'
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Loader as Loader2, ShieldCheck, ExternalLink, FileText } from 'lucide-react'
import { supabase, GuideVerification } from '../../lib/supabase'

export function AdminVerifications() {
  const [verifications, setVerifications] = useState<GuideVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const fetchVerifications = async () => {
    setLoading(true)
    const { data } = await supabase.from('guide_verifications').select('*').order('created_at', { ascending: false })
    setVerifications(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchVerifications() }, [])

  const updateStatus = async (id: string, status: 'aprobado' | 'rechazado') => {
    setActing(id)
    const { error } = await supabase.from('guide_verifications').update({ status }).eq('id', id)
    if (!error) {
      setVerifications(prev => prev.map(v => v.id === id ? { ...v, status } : v))
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
      <h2 className="font-serif text-2xl text-sand-900 mb-6">Verificaciones de guías</h2>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-forest-600" /></div>
      ) : verifications.length === 0 ? (
        <div className="card p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-sand-300 mx-auto mb-3" />
          <p className="text-sand-500">No hay solicitudes de verificación pendientes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map(v => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-sand-900">{v.full_name}</p>
                    {statusBadge(v.status)}
                  </div>
                  <p className="text-sm text-sand-500 mb-1">{v.email}</p>
                  <p className="text-sm text-sand-600"><span className="font-medium">Tipo:</span> {v.doc_type}</p>
                  {v.doc_description && (
                    <p className="text-sm text-sand-600 mt-1"><span className="font-medium">Descripción:</span> {v.doc_description}</p>
                  )}
                  <div className="mt-2">
                    <a href={v.doc_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-forest-600 font-medium hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Ver documentación
                    </a>
                  </div>
                  <p className="text-xs text-sand-400 mt-2">
                    Solicitado el {new Date(v.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {v.status === 'pendiente' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(v.id, 'aprobado')}
                      disabled={acting === v.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 transition-all disabled:opacity-50"
                    >
                      {acting === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Aprobar
                    </button>
                    <button
                      onClick={() => updateStatus(v.id, 'rechazado')}
                      disabled={acting === v.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
