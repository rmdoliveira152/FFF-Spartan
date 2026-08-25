import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export type Profile = {
  id: string
  member_name: string
  role: 'member' | 'admin'
  active: boolean
}

export type PollOption = {
  id: string
  label: string
  position: number
  voteCount: number
}

export type PortalPoll = {
  id: string
  question: string
  active: boolean
  closes_at: string | null
  poll_options: PollOption[]
}

export type R4Application = {
  id: string
  user_id: string
  reason: string
  experience: string
  availability: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles?: { member_name: string } | null
}
