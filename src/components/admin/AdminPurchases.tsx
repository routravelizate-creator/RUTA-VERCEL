import { useEffect, useState } from 'react'
import { Loader as Loader2, DollarSign, Mail, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PurchaseWithDetails {
  id: string
  created_at: string
  payment_status: string
  user_email: string
  route_title: string
  route_price: number
}

export function AdminPurchases() {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('purchases')
      .select(`
        id,
        created_at,
        payment_status,
        profiles!inner(email),
        routes!inner(title, price)
      `)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            created_at: p.created_at,
            payment_status: p.payment_status,
            user_email: p.profiles?.email || '—',
            route_title: p.routes?.title || '—',
            route_price: p.routes?.price || 0,
          }))
          setPurchases(mapped)
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-forest-600" /></div>
  }

  if (purchases.length === 0) {
    return (
      <div className="card p-12 text-center">
        <DollarSign className="w-10 h-10 text-sand-300 mx-auto mb-3" />
        <p className="text-sand-500">No hay compras registradas todavía.</p>
      </div>
    )
  }

  const total = purchases.reduce((sum, p) => sum + Number(p.route_price), 0)

  return (
    <div>
      <div className="card p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-sand-500">Ingresos totales (simulados)</p>
          <p className="font-serif text-3xl text-sand-900">{total.toFixed(2)}€</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-sand-500">Compras</p>
          <p className="font-serif text-3xl text-sand-900">{purchases.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {purchases.map(purchase => (
          <div key={purchase.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-forest-600" />
              </div>
              <div>
                <p className="font-medium text-sand-900">{purchase.route_title}</p>
                <p className="text-sm text-sand-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {purchase.user_email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-lg text-sand-900">{Number(purchase.route_price).toFixed(2)}€</p>
              <p className="text-xs text-forest-600">{purchase.payment_status === 'simulado_pagado' ? '✓ Pagado (simulado)' : purchase.payment_status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
