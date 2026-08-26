import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase, type AllianceMember, type AvailableMember, type BoardNews, type PortalPoll, type Profile } from './supabase'

type ActionResult = { ok: true } | { ok: false; message: string }

export function usePortal() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [polls, setPolls] = useState<PortalPoll[]>([])
  const [members, setMembers] = useState<AllianceMember[]>([])
  const [boardNews, setBoardNews] = useState<BoardNews[]>([])
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([])
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadMembers = async () => {
    const client = supabase
    if (!client) return
    const { data, error } = await client.from('alliance_members').select('id, member_name, rank, player_level, combat_power, kills, weekly_contribution, active').eq('active', true)
    if (error) throw error
    setMembers((data ?? []) as AllianceMember[])
  }

  const loadAvailableMembers = async () => {
    const client = supabase
    if (!client) return
    const { data, error } = await client.rpc('available_alliance_members')
    if (error) throw error
    setAvailableMembers((data ?? []) as AvailableMember[])
  }

  const loadPolls = async () => {
    const client = supabase
    if (!client) return
    const { data, error } = await client
      .from('polls')
      .select('id, question, active, closes_at, created_at, poll_options(id, label, position)')
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

  const loadBoardNews = async () => {
    const client = supabase
    if (!client) return
    const { data, error } = await client
      .from('board_news')
      .select('id, translations, image_paths, default_language, priority, published, published_at, expires_at, archived_at, created_at, updated_at')
      .eq('published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
    if (error) throw error
    setBoardNews((data ?? []) as BoardNews[])
  }

  const loadProfile = async (userId: string) => {
    const client = supabase
    if (!client) return
    const { data } = await client.from('profiles').select('id, member_name, role, active, alliance_member_id, registration_status, notify_poll_emails, notify_news_emails').eq('id', userId).maybeSingle()
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
        await Promise.all([loadPolls(), loadMembers(), loadAvailableMembers(), loadBoardNews()])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void initialise()
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
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

  const signUp = async (email: string, password: string, allianceMemberId: string): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { alliance_member_id: allianceMemberId } },
    })
    if (error) return { ok: false, message: error.message }
    await loadAvailableMembers()
    return { ok: true }
  }

  const requestPasswordReset = async (email: string): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return error ? { ok: false, message: error.message } : { ok: true }
  }

  const updatePassword = async (password: string): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setPasswordRecovery(false)
    return error ? { ok: false, message: error.message } : { ok: true }
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setProfile(null)
    setPasswordRecovery(false)
  }

  const updateEmailPreferences = async (pollEmails: boolean, newsEmails: boolean): Promise<ActionResult> => {
    if (!supabase || !user) return { ok: false, message: 'LOGIN_REQUIRED' }
    const { error } = await supabase.rpc('update_email_preferences', { poll_emails: pollEmails, news_emails: newsEmails })
    if (error) return { ok: false, message: error.message }
    setProfile((current) => current ? { ...current, notify_poll_emails: pollEmails, notify_news_emails: newsEmails } : current)
    return { ok: true }
  }

  const vote = async (pollId: string, optionId: string): Promise<ActionResult> => {
    if (!supabase || !user || !profile?.active || profile.registration_status !== 'approved') return { ok: false, message: 'LOGIN_REQUIRED' }
    const { error } = await supabase.from('votes').insert({ poll_id: pollId, option_id: optionId, user_id: user.id })
    if (error?.code === '23505') return { ok: false, message: 'DUPLICATE_VOTE' }
    if (error) return { ok: false, message: error.message }
    await loadPolls()
    return { ok: true }
  }

  const submitApplication = async (reason: string, experience: string, availability: string, codeAgreed: boolean): Promise<ActionResult> => {
    if (!supabase || !user || !profile?.active || profile.registration_status !== 'approved') return { ok: false, message: 'LOGIN_REQUIRED' }
    const { data, error } = await supabase.functions.invoke('submit-r4-application', {
      body: { reason, experience, availability, codeAgreed },
    })
    return error ? { ok: false, message: data?.error ?? error.message } : { ok: true }
  }

  return {
    configured: isSupabaseConfigured,
    loading,
    user,
    profile,
    polls,
    boardNews,
    members,
    availableMembers,
    passwordRecovery,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    signOut,
    updateEmailPreferences,
    vote,
    submitApplication,
    refreshPolls: loadPolls,
    refreshBoardNews: loadBoardNews,
    refreshMembers: loadMembers,
    refreshAvailableMembers: loadAvailableMembers,
  }
}
