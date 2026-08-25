import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase, type PortalPoll, type Profile } from './supabase'

type ActionResult = { ok: true } | { ok: false; message: string }

export function usePortal() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [polls, setPolls] = useState<PortalPoll[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadPolls = async () => {
    const client = supabase
    if (!client) return
    const { data, error } = await client
      .from('polls')
      .select('id, question, active, closes_at, poll_options(id, label, position)')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (error) throw error

    const enriched = await Promise.all((data ?? []).map(async (poll) => {
      const { data: results } = await client.rpc('poll_results', { requested_poll: poll.id })
      const counts = new Map<string, number>((results ?? []).map((result: { option_id: string; vote_count: number }) => [result.option_id, Number(result.vote_count)]))
      return {
        ...poll,
        poll_options: [...poll.poll_options]
          .sort((first, second) => first.position - second.position)
          .map((option) => ({ ...option, voteCount: counts.get(option.id) ?? 0 })),
      } satisfies PortalPoll
    }))
    setPolls(enriched)
  }

  const loadProfile = async (userId: string) => {
    const client = supabase
    if (!client) return
    const { data } = await client.from('profiles').select('id, member_name, role, active').eq('id', userId).maybeSingle()
    setProfile(data as Profile | null)
  }

  useEffect(() => {
    const client = supabase
    if (!client) return
    let mounted = true
    const initialise = async () => {
      try {
        const { data } = await client.auth.getSession()
        if (!mounted) return
        setUser(data.session?.user ?? null)
        if (data.session?.user) await loadProfile(data.session.user.id)
        await loadPolls()
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void initialise()
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) void loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { ok: false, message: error.message } : { ok: true }
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setProfile(null)
  }

  const vote = async (pollId: string, optionId: string): Promise<ActionResult> => {
    if (!supabase || !user || !profile?.active) return { ok: false, message: 'LOGIN_REQUIRED' }
    const { error } = await supabase.from('votes').insert({ poll_id: pollId, option_id: optionId, user_id: user.id })
    if (error?.code === '23505') return { ok: false, message: 'DUPLICATE_VOTE' }
    if (error) return { ok: false, message: error.message }
    await loadPolls()
    return { ok: true }
  }

  const submitApplication = async (reason: string, experience: string, availability: string): Promise<ActionResult> => {
    if (!supabase || !user || !profile?.active) return { ok: false, message: 'LOGIN_REQUIRED' }
    const { error } = await supabase.from('r4_applications').insert({ user_id: user.id, reason, experience, availability })
    return error ? { ok: false, message: error.message } : { ok: true }
  }

  return {
    configured: isSupabaseConfigured,
    loading,
    user,
    profile,
    polls,
    signIn,
    signOut,
    vote,
    submitApplication,
    refreshPolls: loadPolls,
  }
}
