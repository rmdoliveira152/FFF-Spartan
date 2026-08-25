import { useEffect, useEffectEvent, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { Archive, Check, Languages, LogOut, Megaphone, Pencil, Plus, RotateCcw, Shield, Trash2, X } from 'lucide-react'
import { languages, type Copy, type Language } from './i18n'
import { supabase, type AllianceMember, type AvailableMember, type BoardNews, type BoardNewsTranslation, type PortalPoll, type Profile, type R4Application } from './supabase'

type Props = {
  open: boolean
  copy: Copy
  language: Language
  user: User | null
  profile: Profile | null
  availableMembers: AvailableMember[]
  members: AllianceMember[]
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  onSignUp: (email: string, password: string, allianceMemberId: string) => Promise<{ ok: boolean; message?: string }>
  onRequestPasswordReset: (email: string) => Promise<{ ok: boolean; message?: string }>
  onUpdatePassword: (password: string) => Promise<{ ok: boolean; message?: string }>
  passwordRecovery: boolean
  onSignOut: () => Promise<void>
  onRefreshPolls: () => Promise<void>
  onRefreshBoardNews: () => Promise<void>
  onRefreshMembers: () => Promise<void>
}

const emptyNewsTranslation: BoardNewsTranslation = { title: '', body: '' }

const toDateTimeInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function AdminPortal({ open, copy, language, user, profile, availableMembers, members: initialMembers, onClose, onSignIn, onSignUp, onRequestPasswordReset, onUpdatePassword, passwordRecovery, onSignOut, onRefreshPolls, onRefreshBoardNews, onRefreshMembers }: Props) {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [requestingRecovery, setRequestingRecovery] = useState(false)
  const [editingMember, setEditingMember] = useState<AllianceMember | null>(null)
  const [editingNews, setEditingNews] = useState<BoardNews | null>(null)
  const [newsItems, setNewsItems] = useState<BoardNews[]>([])
  const [newsLanguage, setNewsLanguage] = useState<Language>(language)
  const [newsDefaultLanguage, setNewsDefaultLanguage] = useState<Language>(language)
  const [newsTranslations, setNewsTranslations] = useState<Partial<Record<Language, BoardNewsTranslation>>>({})
  const [polls, setPolls] = useState<PortalPoll[]>([])
  const [applications, setApplications] = useState<R4Application[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [adminMembers, setAdminMembers] = useState<AllianceMember[]>(initialMembers)

  const loadAdminData = async () => {
    const client = supabase
    if (!client || profile?.role !== 'admin') return
    const [pollResponse, newsResponse, applicationResponse, profileResponse, memberResponse] = await Promise.all([
      client.from('polls').select('id, question, active, closes_at, poll_options(id, label, position)').order('created_at', { ascending: false }),
      client.from('board_news').select('id, translations, default_language, priority, published, published_at, expires_at, archived_at, created_at, updated_at').order('created_at', { ascending: false }),
      client.from('r4_applications').select('id, user_id, reason, experience, availability, status, created_at').order('created_at', { ascending: false }),
      client.from('profiles').select('id, member_name, role, active, alliance_member_id, registration_status').order('member_name'),
      client.from('alliance_members').select('id, member_name, rank, player_level, combat_power, kills, weekly_contribution, active').order('member_name'),
    ])
    if (pollResponse.error) throw pollResponse.error
    if (newsResponse.error) throw newsResponse.error
    if (applicationResponse.error) throw applicationResponse.error
    if (profileResponse.error) throw profileResponse.error
    if (memberResponse.error) throw memberResponse.error

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
    setNewsItems((newsResponse.data ?? []) as BoardNews[])
    setApplications((applicationResponse.data ?? []).map((application) => ({
      ...application,
      profiles: { member_name: names.get(application.user_id) ?? application.user_id },
    })) as R4Application[])
    setProfiles(memberProfiles)
    setAdminMembers((memberResponse.data ?? []) as AllianceMember[])
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

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const result = await onSignUp(String(form.get('email')), String(form.get('password')), String(form.get('allianceMemberId')))
    if (!result.ok) setError(result.message ?? 'Unable to register.')
    else setMessage(copy.registrationSent)
    setBusy(false)
  }

  const handleRecoveryRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const result = await onRequestPasswordReset(String(form.get('email')))
    if (!result.ok) setError(result.message ?? 'Unable to send recovery email.')
    else setMessage(copy.recoverySent)
    setBusy(false)
  }

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirmPassword'))) {
      setError(copy.passwordMismatch)
      setBusy(false)
      return
    }
    const result = await onUpdatePassword(password)
    if (!result.ok) setError(result.message ?? 'Unable to update password.')
    else setMessage(copy.passwordUpdated)
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

  const resetNewsEditor = () => {
    setEditingNews(null)
    setNewsLanguage(language)
    setNewsDefaultLanguage(language)
    setNewsTranslations({})
  }

  const editNews = (news: BoardNews) => {
    const defaultLanguage = news.default_language as Language
    setEditingNews(news)
    setNewsDefaultLanguage(defaultLanguage)
    setNewsLanguage((news.translations[language] ? language : defaultLanguage) as Language)
    setNewsTranslations(news.translations as Partial<Record<Language, BoardNewsTranslation>>)
  }

  const updateNewsTranslation = (field: keyof BoardNewsTranslation, value: string) => {
    setNewsTranslations((current) => ({
      ...current,
      [newsLanguage]: { ...(current[newsLanguage] ?? emptyNewsTranslation), [field]: value },
    }))
  }

  const saveNews = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !user) return
    setBusy(true)
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const translations: Partial<Record<Language, BoardNewsTranslation>> = {}
    for (const [code, translation] of Object.entries(newsTranslations) as [Language, BoardNewsTranslation][]) {
      const cleanTranslation = { title: translation.title.trim(), body: translation.body.trim() }
      if (cleanTranslation.title && cleanTranslation.body) translations[code] = cleanTranslation
    }
    if (!translations[newsDefaultLanguage]) {
      setError(copy.translationHint)
      setBusy(false)
      return
    }
    const expiresAt = String(form.get('expiresAt'))
    const published = form.get('published') === 'on'
    const values = {
      translations,
      default_language: newsDefaultLanguage,
      priority: String(form.get('priority')),
      published,
      published_at: editingNews?.published || !published ? editingNews?.published_at ?? new Date().toISOString() : new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      archived_at: editingNews?.archived_at ?? null,
    }
    const response = editingNews
      ? await supabase.from('board_news').update(values).eq('id', editingNews.id)
      : await supabase.from('board_news').insert({ ...values, created_by: user.id })
    if (response.error) setError(response.error.message)
    else {
      resetNewsEditor()
      formElement.reset()
      await Promise.all([loadAdminData(), onRefreshBoardNews()])
    }
    setBusy(false)
  }

  const toggleNewsArchive = async (news: BoardNews) => {
    if (!supabase) return
    setError('')
    const { error: updateError } = await supabase.from('board_news').update({
      archived_at: news.archived_at ? null : new Date().toISOString(),
      expires_at: news.archived_at ? null : news.expires_at,
    }).eq('id', news.id)
    if (updateError) setError(updateError.message)
    else await Promise.all([loadAdminData(), onRefreshBoardNews()])
  }

  const deleteNewsDraft = async (news: BoardNews) => {
    if (!supabase || news.published || !window.confirm(copy.confirmDeleteNews)) return
    setError('')
    const { error: deleteError } = await supabase.from('board_news').delete().eq('id', news.id)
    if (deleteError) setError(deleteError.message)
    else {
      if (editingNews?.id === news.id) resetNewsEditor()
      await loadAdminData()
    }
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

  const reviewRegistration = async (member: Profile, decision: 'approved' | 'rejected') => {
    if (!supabase) return
    setError('')
    const { error: reviewError } = await supabase.rpc('review_registration', { requested_profile: member.id, decision })
    if (reviewError) setError(reviewError.message)
    else await loadAdminData()
  }

  const saveMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const values = {
      member_name: String(form.get('memberName')).trim(),
      rank: String(form.get('rank')),
      player_level: Number(form.get('playerLevel')),
      combat_power: Number(form.get('combatPower')),
      kills: Number(form.get('kills')),
      weekly_contribution: Number(form.get('weeklyContribution')),
      active: form.get('active') === 'on',
      updated_at: new Date().toISOString(),
    }
    const response = editingMember
      ? await supabase.from('alliance_members').update(values).eq('id', editingMember.id)
      : await supabase.from('alliance_members').insert(values)
    if (response.error) setError(response.error.message)
    else {
      setEditingMember(null)
      formElement.reset()
      await Promise.all([onRefreshMembers(), loadAdminData()])
    }
    setBusy(false)
  }

  const deleteMember = async (member: AllianceMember) => {
    if (!supabase || !window.confirm(copy.confirmDelete)) return
    setError('')
    const { error: deleteError } = await supabase.from('alliance_members').delete().eq('id', member.id)
    if (deleteError) setError(deleteError.message)
    else await Promise.all([onRefreshMembers(), loadAdminData()])
  }

  const selectedNewsTranslation = newsTranslations[newsLanguage] ?? emptyNewsTranslation

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className={`login-modal ${profile?.role === 'admin' ? 'admin-portal' : ''}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <button className="close-button" onClick={onClose} aria-label={copy.close}><X /></button>
      <Shield size={36} />
      <h2>{passwordRecovery || requestingRecovery ? copy.resetPasswordTitle : profile?.role === 'admin' ? copy.adminDashboard : registering ? copy.createAccount : copy.memberAccess}</h2>

      {passwordRecovery && <form onSubmit={handlePasswordUpdate}>
        <p>{copy.recoveryInstructions}</p>
        <label>{copy.newPassword}<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
        <label>{copy.confirmPassword}<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" /></label>
        <button className="primary-button" type="submit" disabled={busy}>{copy.updatePassword}</button>
      </form>}

      {!user && !passwordRecovery && <>
        <p>{requestingRecovery ? copy.recoveryInstructions : copy.loginRequired}</p>
        {!requestingRecovery && <div className="auth-switch"><button className={!registering ? 'active' : ''} onClick={() => setRegistering(false)}>{copy.login}</button><button className={registering ? 'active' : ''} onClick={() => setRegistering(true)}>{copy.register}</button></div>}
        <form onSubmit={requestingRecovery ? handleRecoveryRequest : registering ? handleRegistration : handleLogin}>
          <label>{copy.email}<input name="email" type="email" required autoComplete="email" /></label>
          {!requestingRecovery && <label>{copy.password}<input name="password" type="password" required minLength={8} autoComplete={registering ? 'new-password' : 'current-password'} /></label>}
          {registering && !requestingRecovery && <label>{copy.selectMember}<select name="allianceMemberId" required defaultValue=""><option value="" disabled>{copy.choose}</option>{availableMembers.map((member) => <option value={member.id} key={member.id}>{member.member_name} · {member.rank}</option>)}</select></label>}
          <button className="primary-button" type="submit" disabled={busy}>{requestingRecovery ? copy.sendRecovery : registering ? copy.createAccount : copy.login}</button>
        </form>
        {!registering && <button className="auth-link" type="button" onClick={() => { setRequestingRecovery(!requestingRecovery); setError(''); setMessage('') }}>{requestingRecovery ? copy.backToLogin : copy.forgotPassword}</button>}
      </>}

      {message && <p className="form-success" role="status">{message}</p>}

      {user && !passwordRecovery && profile?.role !== 'admin' && <div className="account-state">
        <p><strong>{copy.signedInAs}:</strong> {profile?.member_name ?? user.email}</p>
        {profile?.registration_status === 'pending' && <p>{copy.pendingApproval}</p>}
        {profile?.registration_status === 'rejected' && <p>{copy.rejectedRegistration}</p>}
        {!profile?.active && profile?.registration_status === 'approved' && <p>{copy.inactiveMember}</p>}
        <button className="ghost-button" onClick={onSignOut}><LogOut size={16} />{copy.signOut}</button>
      </div>}

      {!passwordRecovery && profile?.role === 'admin' && <div className="admin-content">
        <div className="admin-heading"><span>{copy.signedInAs}: <strong>{profile.member_name}</strong></span><button className="ghost-button" onClick={onSignOut}><LogOut size={16} />{copy.signOut}</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}

        <section className="admin-block news-admin-block">
          <h3><Megaphone size={18} />{copy.manageNews}</h3>
          <form className="admin-form news-admin-form" key={editingNews?.id ?? 'new-news'} onSubmit={saveNews}>
            <label>{copy.sourceLanguage}<select value={newsDefaultLanguage} onChange={(event) => { const value = event.target.value as Language; setNewsDefaultLanguage(value); setNewsLanguage(value) }}>{languages.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
            <label><Languages size={14} />{copy.language}<select value={newsLanguage} onChange={(event) => setNewsLanguage(event.target.value as Language)}>{languages.map(([code, name]) => <option value={code} key={code}>{name}{newsTranslations[code]?.title && newsTranslations[code]?.body ? ' ✓' : ''}</option>)}</select></label>
            <p className="admin-form-hint">{copy.translationHint}</p>
            <label>{copy.newsHeadline}<input required={newsLanguage === newsDefaultLanguage} maxLength={120} value={selectedNewsTranslation.title} onChange={(event) => updateNewsTranslation('title', event.target.value)} /></label>
            <label className="news-body-field">{copy.newsBody}<textarea required={newsLanguage === newsDefaultLanguage} rows={5} maxLength={2000} value={selectedNewsTranslation.body} onChange={(event) => updateNewsTranslation('body', event.target.value)} /></label>
            <label>{copy.priority}<select name="priority" defaultValue={editingNews?.priority ?? 'standard'}><option value="standard">{copy.standard}</option><option value="important">{copy.important}</option><option value="critical">{copy.critical}</option></select></label>
            <label>{copy.expiresOn}<input name="expiresAt" type="datetime-local" defaultValue={toDateTimeInput(editingNews?.expires_at ?? null)} /></label>
            <label className="check-field"><input name="published" type="checkbox" defaultChecked={editingNews?.published ?? true} />{copy.publishNow}</label>
            <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{editingNews ? copy.save : copy.createNews}</button>{editingNews && <button className="ghost-button" type="button" onClick={resetNewsEditor}>{copy.cancel}</button>}</div>
          </form>

          <div className="admin-list news-admin-list">{newsItems.map((news) => {
            const translation = news.translations[language] ?? news.translations[news.default_language] ?? Object.values(news.translations)[0]
            const endedAt = news.archived_at ?? news.expires_at
            return <article data-priority={news.priority} key={news.id}><div><strong>{translation?.title}</strong><small>{news.archived_at ? copy.archive : news.published ? copy.publishedOn : copy.draft}</small></div>
              <p>{translation?.body}</p><small>{copy.createdOn}: {new Date(news.created_at).toLocaleString(language)}</small>{endedAt && <small>{copy.expiresOn}: {new Date(endedAt).toLocaleString(language)}</small>}
              <div className="row-actions"><button className="compact-button" type="button" onClick={() => editNews(news)}><Pencil size={14} />{copy.editNews}</button>{news.published && <button className="compact-button" type="button" onClick={() => toggleNewsArchive(news)}>{news.archived_at ? <RotateCcw size={14} /> : <Archive size={14} />}{news.archived_at ? copy.restore : copy.archive}</button>}{!news.published && <button className="compact-button danger" type="button" onClick={() => deleteNewsDraft(news)}><Trash2 size={14} />{copy.delete}</button>}</div>
            </article>
          })}</div>
        </section>

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
          <h4>{copy.registrationRequests}</h4>
          <div className="member-access-list">{profiles.filter((member) => member.registration_status === 'pending').map((member) => <div key={member.id}><span><strong>{member.member_name}</strong><small>{member.registration_status}</small></span><span className="row-actions"><button className="compact-button" onClick={() => reviewRegistration(member, 'approved')}><Check size={14} />{copy.approve}</button><button className="compact-button danger" onClick={() => reviewRegistration(member, 'rejected')}><X size={14} />{copy.reject}</button></span></div>)}
            {!profiles.some((member) => member.registration_status === 'pending') && <p>{copy.noRegistrations}</p>}
          </div>
          <div className="member-access-list">{profiles.filter((member) => member.registration_status !== 'pending').map((member) => <div key={member.id}><span><strong>{member.member_name}</strong><small>{member.role} · {member.registration_status}</small></span><button className="compact-button" disabled={member.id === profile.id} onClick={() => toggleMember(member)}>{member.active ? copy.deactivate : copy.activate}</button></div>)}</div>
        </section>

        <section className="admin-block"><h3>{copy.manageRoster}</h3>
          <form className="admin-form roster-form" key={editingMember?.id ?? 'new'} onSubmit={saveMember}>
            <label>{copy.memberName}<input name="memberName" required maxLength={60} defaultValue={editingMember?.member_name} /></label>
            <label>{copy.rank}<select name="rank" required defaultValue={editingMember?.rank ?? 'R3'}>{['R1', 'R2', 'R3', 'R4', 'R5'].map((rank) => <option key={rank}>{rank}</option>)}</select></label>
            <label>{copy.playerLevel}<input name="playerLevel" type="number" required min={1} max={10} defaultValue={editingMember?.player_level ?? 1} /></label>
            <label>{copy.combatPower}<input name="combatPower" type="number" required min={0} defaultValue={editingMember?.combat_power ?? 0} /></label>
            <label>{copy.kills}<input name="kills" type="number" required min={0} defaultValue={editingMember?.kills ?? 0} /></label>
            <label>{copy.weeklyContribution}<input name="weeklyContribution" type="number" required min={0} defaultValue={editingMember?.weekly_contribution ?? 0} /></label>
            <label className="check-field"><input name="active" type="checkbox" defaultChecked={editingMember?.active ?? true} />{copy.active}</label>
            <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{editingMember ? copy.save : copy.addMember}</button>{editingMember && <button className="ghost-button" type="button" onClick={() => setEditingMember(null)}>{copy.cancel}</button>}</div>
          </form>
          <div className="member-access-list roster-admin-list">{adminMembers.map((member) => <div key={member.id}><span><strong>{member.member_name}</strong><small>{member.rank} · Lv. {member.player_level} · {member.combat_power.toLocaleString()} · {member.active ? copy.active : copy.deactivate}</small></span><span className="row-actions"><button className="icon-button" title={copy.editMember} onClick={() => setEditingMember(member)}><Pencil size={15} /></button><button className="icon-button danger" title={copy.delete} onClick={() => deleteMember(member)}><Trash2 size={15} /></button></span></div>)}</div>
        </section>
      </div>}
      {error && profile?.role !== 'admin' && <p className="form-error" role="alert">{error}</p>}
    </section>
  </div>
}
