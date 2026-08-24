import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false,
  },
})

export type ProfileStatus = 'pendiente' | 'aprobado' | 'rechazado'
export type ProfileRole = 'viajero' | 'admin' | 'routraveler'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: ProfileRole
  status: ProfileStatus
  phone: string | null
  bio: string | null
  doc_url: string | null
  doc_type: string | null
  created_at: string
}

export interface Route {
  id: string
  title: string
  subtitle: string
  description: string
  image_url: string
  price: number
  gpx_url: string | null
  pdf_url: string | null
  mymaps_url: string | null
  is_published: boolean
  author_id: string | null
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string | null
  guest_email: string | null
  route_id: string
  payment_status: 'simulado_pagado'
  created_at: string
  route?: Route
}


export { supabase }