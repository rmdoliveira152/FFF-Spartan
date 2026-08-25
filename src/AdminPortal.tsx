import { useEffect, useEffectEvent, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { Check, LogOut, Plus, Shield, X } from 'lucide-react'
import type { Copy } from './i18n'
import { supabase, type PortalPoll, type Profile, type R4Application } from './supabase'

type Props = {
  open: boolean
  copy: Copy
  user: User | null
  profile: Profile | null
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  onSignOut: () => Promise<void>
  onRefreshPolls: () => Promise<void>
}

export function AdminPortal({ open, copy, user, profile, onClose, onSignIn, onSignOut, onRefreshPolls }: Props) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [polls, setPolls] = useState<PortalPoll[]>([])
  const [applications, setApplications] = useState<R4Application[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const loadAdminData = async () => {
    const client = supabase
    if (!client || profile?.role !== 'admin') return
    const [pollResponse, applicationResponse, profileResponse] = await Promise.all([
      client.from('polls').select('id, question, active, closes_at, poll_options(id, label, position)').order('created_at', { ascending: false }),
      client.from('r4_applications').select('id, user_id, reason, experience, availability, status, created_at').order('created_at', { ascending: false }),
      client.from('profiles').select('id, member_name, role, active').order('member_name'),
    ])
    if (pollResponse.error) throw pollResponse.error
    if (applicationResponse.error) throw applicationResponse.error
    if (profileResponse.error) throw profileResponse.error

    const memberProfiles = profileResponse.data as Profile[]
    const names = new Map(memberProfiles.map((item) => [item.id, item.member_name]))
    const enrichedPolls = await Promise.all((pollResponse.data ?? []).map(async (poll) => {
      const { data: results } = await client.rpc('poll_results', { requested_poll: poll.id })
      const counts = new Map<string, number>((results ?? []).map((result: { option_id: string; vote_count: number }) => [result.option_id, Number(result.vote_count)]))
      return {
        ...poll,
        poll_options: [...poll.poll_options]
          .sort((first, second) => first.position - second.position)
          .map((option) => ({ ...option, voteCount: counts.get(option.id) ?? 0 })),
      } satisfies PortalPoll
    }))
    setPolls(enrichedPolls)
    setApplications((applicationResponse.data ?? []).map((application) => ({
      ...application,
      profiles: { member_name: names.get(application.user_id) ?? application.user_id },
    })) as R4Application[])
    setProfiles(memberProfiles)
  }

  const loadAdminDataEvent = useEffectEvent(loadAdminData)

  useEffect(() => {
    if (open && profile?.role === 'admin') {
      // oxlint-disable-next-line react/set-state-in-effect -- Updates happen after the external request resolves.
      void loadAdminDataEvent().catch(console.error)
    }
  }, [open, profile?.role])

  if (!open) return null

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const result = await onSignIn(String(form.get('email')), String(form.get('password')))
    if (!result.ok) setError(result.message ?? 'Unable to sign in.')
    setBusy(false)
  }

  const createPoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const labels = String(form.get('options')).split('\n').map((option) => option.trim()).filter(Boolean)
    const closesAt = String(form.get('closesAt'))
    const { error: createError } = await supabase.rpc('create_poll', {
      poll_question: String(form.get('question')),
      option_labels: labels,
      poll_closes_at: closesAt ? new Date(closesAt).toISOString() : null,
    })
    if (createError) setError(createError.message)
    else {
      formElement.reset()
      await Promise.all([loadAdminData(), onRefreshPolls()])
    }
    setBusy(false)
  }

  const togglePoll = async (poll: PortalPoll) => {
    if (!supabase) return
    const { error: updateError } = await supabase.from('polls').update({ active: !poll.active }).eq('id', poll.id)
    if (updateError) setError(updateError.message)
    else await Promise.all([loadAdminData(), onRefreshPolls()])
  }

  const updateApplication = async (application: R4Application, status: 'approved' | 'rejected') => {
    if (!supabase || !user) return
    const { error: updateError } = await supabase.from('r4_applications').update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', application.id)
    if (updateError) setError(updateError.message)
    else await loadAdminData()
  }

  const toggleMember = async (member: Profile) => {
    if (!supabase) return
    const { error: updateError } = await supabase.from('profiles').update({ active: !member.active }).eq('id', member.id)
    if (updateError) setError(updateError.message)
    else await loadAdminData()
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className={`login-modal ${profile?.role === 'admin' ? 'admin-portal' : ''}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <button className="close-button" onClick={onClose} aria-label={copy.close}><X /></button>
      <Shield size={36} />
      <h2>{profile?.role === 'admin' ? copy.adminDashboard : copy.adminTitle}</h2>

      {!user && <>
        <p>{copy.loginRequired}</p>
        <form onSubmit={handleLogin}>
          <label>{copy.email}<input name="email" type="email" required autoComplete="email" /></label>
          <label>{copy.password}<input name="password" type="password" required autoComplete="current-password" /></label>
          <button className="primary-button" type="submit" disabled={busy}>{copy.login}</button>
        </form>
      </>}

      {user && profile?.role !== 'admin' && <div className="account-state">
        <p><strong>{copy.signedInAs}:</strong> {profile?.member_name ?? user.email}</p>
        {!profile?.active && <p>{copy.inactiveMember}</p>}
        <button className="ghost-button" onClick={onSignOut}><LogOut size={16} />{copy.signOut}</button>
      </div>}

      {profile?.role === 'admin' && <div className="admin-content">
        <div className="admin-heading"><span>{copy.signedInAs}: <strong>{profile.member_name}</strong></span><button className="ghost-button" onClick={onSignOut}><LogOut size={16} />{copy.signOut}</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}

        <section className="admin-block">
          <h3><Plus size={18} />{copy.createPoll}</h3>
          <form className="admin-form" onSubmit={createPoll}>
            <label>{copy.question}<input name="question" required minLength={5} maxLength={240} /></label>
            <label>{copy.options}<textarea name="options" required rows={4} placeholder={'Option 1\nOption 2'} /></label>
            <label>{copy.closingDate}<input name="closesAt" type="datetime-local" /></label>
            <button className="primary-button" type="submit" disabled={busy}>{copy.publish}</button>
          </form>
        </section>

        <section className="admin-block"><h3>{copy.pollsTitle}</h3>
          <div className="admin-list">{polls.map((poll) => <article key={poll.id}><div><strong>{poll.question}</strong><small>{poll.poll_options.reduce((total, option) => total + option.voteCount, 0)} {copy.votes}</small></div>
            <ul>{poll.poll_options.map((option) => <li key={option.id}>{option.label}<b>{option.voteCount}</b></li>)}</ul>
            <button className="compact-button" onClick={() => togglePoll(poll)}>{poll.active ? copy.deactivate : copy.activate}</button></article>)}</div>
        </section>

        <section className="admin-block"><h3>{copy.applications}</h3>
          <div className="admin-list">{applications.map((application) => <article key={application.id}><div><strong>{application.profiles?.member_name}</strong><small>{application.status}</small></div><p>{application.reason}</p><p>{application.experience}</p><small>{application.availability}</small>
            {application.status === 'pending' && <div className="row-actions"><button className="compact-button" onClick={() => updateApplication(application, 'approved')}><Check size={14} />{copy.approve}</button><button className="compact-button danger" onClick={() => updateApplication(application, 'rejected')}><X size={14} />{copy.reject}</button></div>}</article>)}</div>
        </section>

        <section className="admin-block"><h3>{copy.memberAccess}</h3>
          <div className="member-access-list">{profiles.map((member) => <div key={member.id}><span><strong>{member.member_name}</strong><small>{member.role}</small></span><button className="compact-button" disabled={member.id === profile.id} onClick={() => toggleMember(member)}>{member.active ? copy.deactivate : copy.activate}</button></div>)}</div>
        </section>
      </div>}
      {error && profile?.role !== 'admin' && <p className="form-error" role="alert">{error}</p>}
    </section>
  </div>
}
