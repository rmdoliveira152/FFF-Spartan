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
  alliance_member_id: string | null
  registration_status: 'pending' | 'approved' | 'rejected'
}

export type AllianceMember = {
  id: string
  member_name: string
  rank: 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  player_level: number
  combat_power: number
  kills: number
  weekly_contribution: number
  active: boolean
}

export type AvailableMember = Pick<AllianceMember, 'id' | 'member_name' | 'rank'>

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

export type BoardNewsTranslation = {
  title: string
  body: string
}

export type BoardNews = {
  id: string
  translations: Partial<Record<string, BoardNewsTranslation>>
  default_language: string
  priority: 'standard' | 'important' | 'critical'
  published: boolean
  published_at: string
  expires_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
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
