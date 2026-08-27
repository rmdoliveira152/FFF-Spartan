import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { Activity, Archive, Check, ClipboardList, FileSpreadsheet, History, ImagePlus, LogOut, Megaphone, Pencil, Plus, RotateCcw, Search, Shield, Trash2, TrendingDown, TrendingUp, Users, Vote, X } from 'lucide-react'
import { type Copy, type Language } from './i18n'
import { getBoardNewsImageUrl, supabase, type AdminAuditEvent, type AdminMemberLogin, type AllianceMember, type AvailableMember, type BoardNews, type BoardNewsTranslation, type MemberPerformanceSnapshot, type PerformanceIndicator, type PortalPoll, type Profile, type R4Application } from './supabase'
import { LocalizedIntegerInput } from './LocalizedIntegerInput'
import { parseLocalizedInteger } from './localizedInteger'
import { useDialogFocus } from './useDialogFocus'

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
  onSignUp: (email: string, password: string, allianceMemberId: string) => Promise<{ ok: boolean; message?: string; code?: string; retryAfter?: number }>
  onRequestPasswordReset: (email: string) => Promise<{ ok: boolean; message?: string }>
  onUpdatePassword: (password: string) => Promise<{ ok: boolean; message?: string }>
  onUpdateEmailPreferences: (pollEmails: boolean, newsEmails: boolean) => Promise<{ ok: boolean; message?: string }>
  passwordRecovery: boolean
  onSignOut: () => Promise<void>
  onRefreshPolls: () => Promise<void>
  onRefreshBoardNews: () => Promise<void>
  onRefreshMembers: () => Promise<void>
  onRefreshAvailableMembers: () => Promise<void>
}

const emptyNewsTranslation: BoardNewsTranslation = { title: '', body: '' }
type AccessFilter = 'pending' | 'approved' | 'inactive'
type SelectedNewsImage = { id: string; file: File }

function NewsImagePreview({ image, title, removeLabel, onRemove }: { image: SelectedNewsImage; title: string; removeLabel: string; onRemove: () => void }) {
  const [previewUrl] = useState(() => URL.createObjectURL(image.file))

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  return <div className="news-image-pending">
    <img src={previewUrl} alt={`${title || image.file.name} preview`} />
    <span>{image.file.name}</span>
    <button type="button" title={removeLabel} onClick={onRemove}><X size={14} /></button>
  </div>
}

const toDateTimeInput = (value: string | null) => {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

const fromGameServerTime = (value: string) => new Date(`${value}:00Z`).toISOString()

const formatGameServerTime = (value: string, language: Language) => new Intl.DateTimeFormat(language, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
}).format(new Date(value))

const todayUtc = () => {
  const date = new Date()
  return date.toISOString().slice(0, 10)
}

const yesterdayUtc = () => {
  const date = new Date(`${todayUtc()}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

const maximumSafeInteger = Number.MAX_SAFE_INTEGER

export function AdminPortal({ open, copy, language, user, profile, availableMembers, members: initialMembers, onClose, onSignIn, onSignUp, onRequestPasswordReset, onUpdatePassword, onUpdateEmailPreferences, passwordRecovery, onSignOut, onRefreshPolls, onRefreshBoardNews, onRefreshMembers, onRefreshAvailableMembers }: Props) {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [requestingRecovery, setRequestingRecovery] = useState(false)
  const [editingMember, setEditingMember] = useState<AllianceMember | null>(null)
  const [performanceMember, setPerformanceMember] = useState<AllianceMember | null>(null)
  const [performanceDefaults, setPerformanceDefaults] = useState<MemberPerformanceSnapshot | null>(null)
  const [ownPerformanceHistory, setOwnPerformanceHistory] = useState<MemberPerformanceSnapshot[]>([])
  const [ownPerformanceLoadedFor, setOwnPerformanceLoadedFor] = useState<string | null>(null)
  const [ownSnapshotDate, setOwnSnapshotDate] = useState(todayUtc)
  const [editingNews, setEditingNews] = useState<BoardNews | null>(null)
  const [newsItems, setNewsItems] = useState<BoardNews[]>([])
  const [newsOriginal, setNewsOriginal] = useState<BoardNewsTranslation>(emptyNewsTranslation)
  const [newsImagePaths, setNewsImagePaths] = useState<string[]>([])
  const [newsImageFiles, setNewsImageFiles] = useState<SelectedNewsImage[]>([])
  const [polls, setPolls] = useState<PortalPoll[]>([])
  const [editingPoll, setEditingPoll] = useState<PortalPoll | null>(null)
  const [applications, setApplications] = useState<R4Application[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [adminMembers, setAdminMembers] = useState<AllianceMember[]>(initialMembers)
  const [memberLogins, setMemberLogins] = useState<AdminMemberLogin[]>([])
  const [indicators, setIndicators] = useState<PerformanceIndicator[]>([])
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([])
  const [memberQuery, setMemberQuery] = useState('')
  const [memberRank, setMemberRank] = useState('ALL')
  const [memberStatus, setMemberStatus] = useState('ALL')
  const [memberFreshness, setMemberFreshness] = useState('ALL')
  const [newsFilter, setNewsFilter] = useState<'active' | 'expired' | 'archived'>('active')
  const [pollFilter, setPollFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('pending')
  const [accessQuery, setAccessQuery] = useState('')
  const [filterReferenceTime] = useState(Date.now)
  const dialogRef = useRef<HTMLElement>(null)
  useDialogFocus(dialogRef, open)

  const filteredAdminMembers = adminMembers
    .filter((member) => member.member_name.toLocaleLowerCase(language).includes(memberQuery.trim().toLocaleLowerCase(language)))
    .filter((member) => memberRank === 'ALL' || member.rank === memberRank)
    .filter((member) => memberStatus === 'ALL' || (memberStatus === 'active' ? member.active : !member.active))
    .filter((member) => memberFreshness === 'ALL' || (memberFreshness === 'stale' ? !member.performance_updated_at || filterReferenceTime - Date.parse(member.performance_updated_at) > 14 * 86_400_000 : Boolean(member.performance_updated_at) && filterReferenceTime - Date.parse(member.performance_updated_at!) <= 14 * 86_400_000))
  const filteredNews = newsItems.filter((news) => newsFilter === 'archived' ? Boolean(news.archived_at) : newsFilter === 'expired' ? !news.archived_at && Boolean(news.expires_at && Date.parse(news.expires_at) <= filterReferenceTime) : !news.archived_at && (!news.expires_at || Date.parse(news.expires_at) > filterReferenceTime))
  const filteredPolls = polls.filter((poll) => pollFilter === 'all' || (pollFilter === 'active' ? poll.active : !poll.active))
  const memberLoginById = new Map(memberLogins.map((login) => [login.member_id, login]))
  const ownMember = profile?.alliance_member_id ? initialMembers.find((member) => member.id === profile.alliance_member_id) ?? null : null
  const ownPerformanceDefaults = ownPerformanceHistory.find((snapshot) => snapshot.snapshot_date === ownSnapshotDate)
    ?? ownPerformanceHistory.at(-1)
    ?? null
  const accessProfiles: Record<AccessFilter, Profile[]> = {
    pending: profiles.filter((member) => member.registration_status === 'pending'),
    approved: profiles.filter((member) => member.registration_status === 'approved' && member.active),
    inactive: profiles.filter((member) => member.registration_status !== 'pending' && (member.registration_status !== 'approved' || !member.active)),
  }
  const filteredAccessProfiles = accessProfiles[accessFilter].filter((member) =>
    member.member_name.toLocaleLowerCase(language).includes(accessQuery.trim().toLocaleLowerCase(language)),
  )

  const loadAdminData = async () => {
    const client = supabase
    if (!client || profile?.role !== 'admin') return
    const [pollResponse, newsResponse, applicationResponse, profileResponse, memberResponse, loginResponse, indicatorResponse, auditResponse] = await Promise.all([
      client.from('polls').select('id, question, active, closes_at, created_at, poll_options(id, label, position)').order('created_at', { ascending: false }),
      client.from('board_news').select('id, translations, image_paths, default_language, priority, published, published_at, expires_at, archived_at, created_at, updated_at').order('created_at', { ascending: false }),
      client.from('r4_applications').select('id, user_id, reason, experience, availability, status, created_at').order('created_at', { ascending: false }),
      client.from('profiles').select('id, member_name, role, active, alliance_member_id, registration_status, notify_poll_emails, notify_news_emails').order('member_name'),
      client.from('alliance_members').select('id, member_name, rank, player_level, combat_power, kills, weekly_contribution, active, performance_updated_at').order('member_name'),
      client.rpc('admin_member_last_logins'),
      client.rpc('admin_performance_indicators'),
      client.from('admin_audit_events').select('id, actor_id, action, resource_kind, resource_id, changes, created_at').order('created_at', { ascending: false }).limit(100),
    ])
    if (pollResponse.error) throw pollResponse.error
    if (newsResponse.error) throw newsResponse.error
    if (applicationResponse.error) throw applicationResponse.error
    if (profileResponse.error) throw profileResponse.error
    if (memberResponse.error) throw memberResponse.error
    if (loginResponse.error) throw loginResponse.error
    if (indicatorResponse.error) throw indicatorResponse.error
    if (auditResponse.error) throw auditResponse.error

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
    setMemberLogins((loginResponse.data ?? []) as AdminMemberLogin[])
    setIndicators((indicatorResponse.data ?? []) as PerformanceIndicator[])
    setAuditEvents((auditResponse.data ?? []) as AdminAuditEvent[])
  }

  const loadAdminDataEvent = useEffectEvent(loadAdminData)

  const loadOwnPerformance = async () => {
    if (!supabase || !ownMember || !profile?.active || profile.registration_status !== 'approved') return
    const { data, error: historyError } = await supabase.rpc('member_performance_history', { requested_member: ownMember.id })
    if (historyError) setError(historyError.message)
    else setOwnPerformanceHistory((data ?? []) as MemberPerformanceSnapshot[])
    setOwnPerformanceLoadedFor(ownMember.id)
  }
  const loadOwnPerformanceEvent = useEffectEvent(loadOwnPerformance)

  useEffect(() => {
    if (open && profile?.role === 'admin') {
      // oxlint-disable-next-line react/set-state-in-effect -- Updates happen after the external request resolves.
      void loadAdminDataEvent().catch(console.error)
    }
  }, [open, profile?.role])

  useEffect(() => {
    if (open && profile?.role !== 'admin' && profile?.active && profile.registration_status === 'approved' && ownMember) {
      // oxlint-disable-next-line react/set-state-in-effect -- Synchronizes the form with performance history stored externally.
      void loadOwnPerformanceEvent()
    }
  }, [open, profile?.role, profile?.active, profile?.registration_status, ownMember])

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
    if (!result.ok) {
      setError(result.code === 'member_registration_exists'
        ? copy.registrationAlreadyExists
        : result.code === 'over_email_send_rate_limit'
          ? copy.registrationCooldown.replace('{seconds}', String(result.retryAfter ?? 60))
          : result.message ?? 'Unable to register.')
    }
    else setMessage(copy.registrationSent)
    setBusy(false)
  }

  const saveOwnPerformance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !ownMember) return
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const { error: saveError } = await supabase.rpc('save_own_member_performance', {
      requested_date: String(form.get('snapshotDate')),
      requested_combat_power: parseLocalizedInteger(form.get('combatPower')),
      requested_kills: parseLocalizedInteger(form.get('kills')),
      requested_weekly_contribution: parseLocalizedInteger(form.get('weeklyContribution')),
      requested_formations: [1, 2, 3, 4].map((number) => parseLocalizedInteger(form.get(`formation${number}`))),
    })
    if (saveError) setError(saveError.message)
    else {
      setMessage(copy.performanceSaved)
      await onRefreshMembers()
      await loadOwnPerformance()
    }
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

  const saveEmailPreferences = async (pollEmails: boolean, newsEmails: boolean) => {
    setError('')
    const result = await onUpdateEmailPreferences(pollEmails, newsEmails)
    if (!result.ok) setError(result.message ?? copy.notificationFailed)
  }

  const notifyMembers = async (kind: 'poll' | 'board_news', resourceId: string) => {
    if (!supabase) return
    const { error: notificationError } = await supabase.functions.invoke('notify-members', { body: { kind, resourceId } })
    if (notificationError) setError(copy.notificationFailed)
    else setMessage(copy.membersNotified)
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
    const shouldNotify = form.get('notifyMembers') === 'on'
    const { data: pollId, error: createError } = await supabase.rpc('create_poll', {
      poll_question: String(form.get('question')),
      option_labels: labels,
      poll_closes_at: closesAt ? fromGameServerTime(closesAt) : null,
    })
    if (createError) setError(createError.message)
    else {
      formElement.reset()
      await Promise.all([loadAdminData(), onRefreshPolls()])
      if (shouldNotify && pollId) await notifyMembers('poll', String(pollId))
    }
    setBusy(false)
  }

  const updatePoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !editingPoll) return
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const hasVotes = editingPoll.poll_options.some((option) => option.voteCount > 0)
    const labels = hasVotes
      ? editingPoll.poll_options.map((option) => option.label)
      : String(form.get('options')).split('\n').map((option) => option.trim()).filter(Boolean)
    const closesAt = String(form.get('closesAt'))
    const { error: updateError } = await supabase.rpc('update_poll', {
      requested_poll: editingPoll.id,
      poll_question: String(form.get('question')),
      option_labels: labels,
      poll_closes_at: closesAt ? fromGameServerTime(closesAt) : null,
    })
    if (updateError) setError(updateError.message)
    else {
      setEditingPoll(null)
      await Promise.all([loadAdminData(), onRefreshPolls()])
    }
    setBusy(false)
  }

  const togglePoll = async (poll: PortalPoll) => {
    if (!supabase) return
    const { error: updateError } = await supabase.from('polls').update({ active: !poll.active }).eq('id', poll.id)
    if (updateError) setError(updateError.message)
    else {
      if (editingPoll?.id === poll.id) setEditingPoll(null)
      await Promise.all([loadAdminData(), onRefreshPolls()])
    }
  }

  const deletePoll = async (poll: PortalPoll) => {
    if (!supabase || poll.active || !window.confirm(`${copy.delete}: ${poll.question}?`)) return
    setError('')
    const { error: deleteError } = await supabase.from('polls').delete().eq('id', poll.id).eq('active', false)
    if (deleteError) setError(deleteError.message)
    else await Promise.all([loadAdminData(), onRefreshPolls()])
  }

  const resetNewsEditor = () => {
    setEditingNews(null)
    setNewsOriginal(emptyNewsTranslation)
    setNewsImagePaths([])
    setNewsImageFiles([])
  }

  const editNews = (news: BoardNews) => {
    setEditingNews(news)
    setNewsOriginal(news.translations[news.default_language] ?? Object.values(news.translations)[0] ?? emptyNewsTranslation)
    setNewsImagePaths(news.image_paths)
    setNewsImageFiles([])
  }

  const selectNewsImages = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? [])
    if (newsImagePaths.length + newsImageFiles.length + selectedFiles.length > 4) {
      setError(`${copy.newsImages}: 4 max.`)
      return
    }
    const invalidFile = selectedFiles.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    if (invalidFile) {
      setError(`${invalidFile.name}: PNG, JPEG or WebP, 5 MB max.`)
      return
    }
    setError('')
    setNewsImageFiles((current) => [...current, ...selectedFiles.map((file) => ({ id: crypto.randomUUID(), file }))])
  }

  const saveNews = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !user) return
    setBusy(true)
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const original = { title: newsOriginal.title.trim(), body: newsOriginal.body.trim() }
    if (!original.title || !original.body) {
      setError(copy.translationHint)
      setBusy(false)
      return
    }
    const expiresAt = String(form.get('expiresAt'))
    const published = form.get('published') === 'on'
    const shouldNotify = !editingNews && published && form.get('notifyMembers') === 'on'
    const uploadedPaths: string[] = []
    for (const selectedImage of newsImageFiles) {
      const file = selectedImage.file
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('board-news').upload(path, file, { contentType: file.type })
      if (uploadError) {
        if (uploadedPaths.length) await supabase.storage.from('board-news').remove(uploadedPaths)
        setError(uploadError.message)
        setBusy(false)
        return
      }
      uploadedPaths.push(path)
    }
    const values = {
      translations: { und: original },
      image_paths: [...newsImagePaths, ...uploadedPaths],
      default_language: 'und',
      priority: String(form.get('priority')),
      published,
      published_at: editingNews?.published || !published ? editingNews?.published_at ?? new Date().toISOString() : new Date().toISOString(),
      expires_at: expiresAt ? fromGameServerTime(expiresAt) : null,
      archived_at: editingNews?.archived_at ?? null,
    }
    let responseError: { message: string } | null = null
    let createdNewsId: string | null = null
    if (editingNews) {
      const { error: updateError } = await supabase.from('board_news').update(values).eq('id', editingNews.id)
      responseError = updateError
    } else {
      const { data: createdNews, error: insertError } = await supabase.from('board_news').insert({ ...values, created_by: user.id }).select('id').single()
      responseError = insertError
      createdNewsId = createdNews?.id ?? null
    }
    if (responseError) {
      if (uploadedPaths.length) await supabase.storage.from('board-news').remove(uploadedPaths)
      setError(responseError.message)
    }
    else {
      const removedPaths = editingNews?.image_paths.filter((path) => !newsImagePaths.includes(path)) ?? []
      if (removedPaths.length) await supabase.storage.from('board-news').remove(removedPaths)
      resetNewsEditor()
      formElement.reset()
      await Promise.all([loadAdminData(), onRefreshBoardNews()])
      if (shouldNotify && createdNewsId) await notifyMembers('board_news', createdNewsId)
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

  const deleteArchivedNews = async (news: BoardNews) => {
    if (!supabase || !news.archived_at || !window.confirm(copy.confirmDeleteNews)) return
    setError('')
    const { error: deleteError } = await supabase.from('board_news').delete().eq('id', news.id).not('archived_at', 'is', null)
    if (deleteError) setError(deleteError.message)
    else {
      if (news.image_paths.length) await supabase.storage.from('board-news').remove(news.image_paths)
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

  const deleteApplication = async (application: R4Application) => {
    if (!supabase || !window.confirm(`${copy.delete}: ${application.profiles?.member_name ?? application.user_id}?`)) return
    setError('')
    const { error: deleteError } = await supabase.from('r4_applications').delete().eq('id', application.id)
    if (deleteError) setError(deleteError.message)
    else await loadAdminData()
  }

  const toggleMember = async (member: Profile) => {
    if (!supabase) return
    const { error: updateError } = await supabase.rpc('set_profile_active', { requested_profile: member.id, requested_active: !member.active })
    if (updateError) setError(updateError.message)
    else await loadAdminData()
  }

  const updateMemberRole = async (member: Profile) => {
    if (!supabase) return
    const requestedRole = member.role === 'admin' ? 'member' : 'admin'
    const confirmation = requestedRole === 'admin' ? copy.confirmPromoteAdmin : copy.confirmDemoteAdmin
    if (!window.confirm(`${member.member_name}: ${confirmation}`)) return
    setError('')
    const { error: updateError } = await supabase.rpc('set_profile_role', { requested_profile: member.id, requested_role: requestedRole })
    if (updateError) setError(updateError.message)
    else await loadAdminData()
  }

  const reviewRegistration = async (member: Profile, decision: 'approved' | 'rejected') => {
    if (!supabase) return
    setError('')
    const { error: reviewError } = await supabase.rpc('review_registration', { requested_profile: member.id, decision })
    if (reviewError) setError(reviewError.message)
    else {
      if (decision === 'approved') {
        const { error: notificationError } = await supabase.functions.invoke('notify-registration-approved', {
          body: { profileId: member.id },
        })
        if (notificationError) setError(copy.notificationFailed)
      }
      await loadAdminData()
    }
  }

  const deleteInactiveAccount = async (member: Profile) => {
    if (!supabase || member.active || member.role !== 'member' || !window.confirm(`${copy.delete}: ${member.member_name}?`)) return
    setError('')
    const { error: deleteError } = await supabase.rpc('delete_inactive_member_account', { requested_profile: member.id })
    if (deleteError) setError(deleteError.message)
    else await Promise.all([loadAdminData(), onRefreshAvailableMembers()])
  }

  const saveMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const memberDetails = {
      member_name: String(form.get('memberName')).trim(),
      rank: String(form.get('rank')),
      player_level: Number(form.get('playerLevel')),
      active: form.get('active') === 'on',
      updated_at: new Date().toISOString(),
    }
    const response = editingMember
      ? await supabase.from('alliance_members').update(memberDetails).eq('id', editingMember.id)
      : await supabase.from('alliance_members').insert({
          ...memberDetails,
          combat_power: parseLocalizedInteger(form.get('combatPower')),
          kills: parseLocalizedInteger(form.get('kills')),
          weekly_contribution: parseLocalizedInteger(form.get('weeklyContribution')),
        })
    if (response.error) setError(response.error.message)
    else {
      setEditingMember(null)
      formElement.reset()
      await Promise.all([onRefreshMembers(), loadAdminData()])
    }
    setBusy(false)
  }

  const openPerformanceEditor = async (member: AllianceMember) => {
    setPerformanceMember(member)
    setPerformanceDefaults(null)
    setError('')
    if (!supabase) return
    const { data, error: historyError } = await supabase.rpc('member_performance_history', { requested_member: member.id })
    if (historyError) setError(historyError.message)
    else setPerformanceDefaults(((data ?? []).at(-1) as MemberPerformanceSnapshot | undefined) ?? null)
  }

  const savePerformance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !performanceMember) return
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const { error: saveError } = await supabase.rpc('save_member_performance', {
      requested_member: performanceMember.id,
      requested_date: String(form.get('snapshotDate')),
      requested_combat_power: parseLocalizedInteger(form.get('combatPower')),
      requested_kills: parseLocalizedInteger(form.get('kills')),
      requested_weekly_contribution: parseLocalizedInteger(form.get('weeklyContribution')),
      requested_formations: [1, 2, 3, 4].map((number) => parseLocalizedInteger(form.get(`formation${number}`))),
    })
    if (saveError) setError(saveError.message)
    else {
      setMessage(copy.performanceSaved)
      setPerformanceMember(null)
      setPerformanceDefaults(null)
      await Promise.all([loadAdminData(), onRefreshMembers()])
    }
    setBusy(false)
  }

  const exportRosterStatistics = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const latestFormations = new Map<string, Map<number, number>>()
      const pageSize = 1000
      let pageStart = 0
      while (latestFormations.size < adminMembers.length) {
        const { data, error: snapshotsError } = await supabase
          .from('member_performance_snapshots')
          .select('member_id, snapshot_date, member_formation_powers(formation_number, combat_power)')
          .order('snapshot_date', { ascending: false })
          .range(pageStart, pageStart + pageSize - 1)
        if (snapshotsError) throw snapshotsError
        for (const snapshot of data ?? []) {
          if (latestFormations.has(snapshot.member_id)) continue
          latestFormations.set(snapshot.member_id, new Map(
            snapshot.member_formation_powers.map((formation) => [formation.formation_number, formation.combat_power]),
          ))
        }
        if (!data || data.length < pageSize) break
        pageStart += pageSize
      }

      const headerStyle = {
        fontWeight: 'bold' as const,
        backgroundColor: '#0055A4',
        textColor: '#ffffff',
        bottomBorderColor: '#EF4135',
        bottomBorderStyle: 'thick' as const,
        align: 'center' as const,
        alignVertical: 'center' as const,
        height: 30,
        wrap: true,
      }
      const sheetData = [
        [copy.memberName, copy.rank, copy.playerLevel, copy.combatPower, copy.kills, copy.weeklyContribution, copy.lastUpdate, ...[1, 2, 3, 4].map((number) => `${copy.formation} ${number} · ${copy.combatPower}`)]
          .map((value) => ({ value, ...headerStyle })),
        ...adminMembers.map((member, memberIndex) => {
          const formations = latestFormations.get(member.id)
          const rowStyle = {
            backgroundColor: memberIndex % 2 === 0 ? '#ffffff' : '#F1F5F9',
            textColor: '#1F2937',
            alignVertical: 'center' as const,
            height: 22,
          }
          return ([
            member.member_name,
            member.rank,
            member.player_level,
            member.combat_power,
            member.kills,
            member.weekly_contribution,
            member.performance_updated_at ? new Date(member.performance_updated_at) : null,
            ...[1, 2, 3, 4].map((number) => formations?.get(number) ?? null),
          ] as const).map((value, columnIndex) => ({
            value: value ?? undefined,
            ...rowStyle,
            align: columnIndex === 0 ? 'left' as const : columnIndex === 6 ? 'center' as const : 'right' as const,
            ...(columnIndex === 6 && value ? { format: 'yyyy-mm-dd' } : {}),
          }))
        }),
      ]
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      await writeXlsxFile(sheetData, {
        sheet: copy.rosterSheet,
        stickyRowsCount: 1,
        columns: [{ width: 24 }, { width: 8 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 20 }, { width: 14 }, ...[1, 2, 3, 4].map(() => ({ width: 23 }))],
      }).toFile(`FFF-Spartan-roster-${todayUtc()}.xlsx`)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : copy.exportFailed)
    } finally {
      setBusy(false)
    }
  }

  const deleteMember = async (member: AllianceMember) => {
    if (!supabase || !window.confirm(copy.confirmDelete)) return
    setError('')
    const { error: deleteError } = await supabase.from('alliance_members').delete().eq('id', member.id)
    if (deleteError) setError(deleteError.message)
    else await Promise.all([onRefreshMembers(), loadAdminData()])
  }

  const scrollToAdminSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className={`login-modal ${profile?.role === 'admin' ? 'admin-portal' : ''}`} ref={dialogRef} role="dialog" aria-modal="true" onKeyDown={(event) => { if (event.key === 'Escape') onClose() }} onMouseDown={(event) => event.stopPropagation()}>
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
        {profile?.active && profile.registration_status === 'approved' && ownMember && ownPerformanceLoadedFor !== ownMember.id && <p className="performance-loading">...</p>}
        {profile?.active && profile.registration_status === 'approved' && ownMember && ownPerformanceLoadedFor === ownMember.id && <form className="performance-entry-form own-performance-form" key={`${ownMember.id}:${ownSnapshotDate}:${ownPerformanceDefaults?.recorded_at ?? 'new'}`} onSubmit={saveOwnPerformance}>
          <div className="performance-entry-heading"><div><small>{copy.myStatistics}</small><strong>{ownMember.member_name}</strong></div><Activity size={20} /></div>
          <p>{copy.selfPerformanceHint}</p>
          <label>{copy.snapshotDate}<select name="snapshotDate" value={ownSnapshotDate} onChange={(event) => setOwnSnapshotDate(event.target.value)}><option value={todayUtc()}>{copy.currentWeek} · {todayUtc()}</option><option value={yesterdayUtc()}>{copy.previousWeek} · {yesterdayUtc()}</option></select></label>
          <label>{copy.combatPower}<LocalizedIntegerInput name="combatPower" language={language} maximum={maximumSafeInteger} defaultValue={ownMember.combat_power} /></label>
          <label>{copy.kills}<LocalizedIntegerInput name="kills" language={language} maximum={maximumSafeInteger} defaultValue={ownMember.kills} /></label>
          <label>{copy.weeklyContribution}<LocalizedIntegerInput name="weeklyContribution" language={language} maximum={maximumSafeInteger} defaultValue={ownMember.weekly_contribution} /></label>
          {[1, 2, 3, 4].map((number) => <label key={number}>{copy.formation} {number}<LocalizedIntegerInput name={`formation${number}`} language={language} maximum={maximumSafeInteger} defaultValue={ownPerformanceDefaults?.[`formation_${number}` as keyof MemberPerformanceSnapshot] as number ?? 0} /></label>)}
          <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{copy.saveSnapshot}</button></div>
        </form>}
        {profile && <fieldset className="email-preferences"><legend>{copy.emailPreferences}</legend><label className="check-field"><input type="checkbox" checked={profile.notify_poll_emails} onChange={(event) => void saveEmailPreferences(event.target.checked, profile.notify_news_emails)} />{copy.notifyPollEmails}</label><label className="check-field"><input type="checkbox" checked={profile.notify_news_emails} onChange={(event) => void saveEmailPreferences(profile.notify_poll_emails, event.target.checked)} />{copy.notifyNewsEmails}</label></fieldset>}
        <button className="ghost-button" onClick={onSignOut}><LogOut size={16} />{copy.signOut}</button>
      </div>}

      {!passwordRecovery && profile?.role === 'admin' && <div className="admin-content">
        <div className="admin-heading"><span>{copy.signedInAs}: <strong>{profile.member_name}</strong></span><button className="ghost-button" onClick={onSignOut}><LogOut size={16} />{copy.signOut}</button></div>
        <fieldset className="email-preferences"><legend>{copy.emailPreferences}</legend><label className="check-field"><input type="checkbox" checked={profile.notify_poll_emails} onChange={(event) => void saveEmailPreferences(event.target.checked, profile.notify_news_emails)} />{copy.notifyPollEmails}</label><label className="check-field"><input type="checkbox" checked={profile.notify_news_emails} onChange={(event) => void saveEmailPreferences(profile.notify_poll_emails, event.target.checked)} />{copy.notifyNewsEmails}</label></fieldset>
        <nav className="admin-section-nav" aria-label={copy.adminDashboard}>
          <button type="button" onClick={() => scrollToAdminSection('admin-news')}><Megaphone size={16} /><span>{copy.manageNews}</span></button>
          <button type="button" onClick={() => scrollToAdminSection('admin-create-poll')}><Plus size={16} /><span>{copy.createPoll}</span></button>
          <button type="button" onClick={() => scrollToAdminSection('admin-polls')}><Vote size={16} /><span>{copy.pollsTitle}</span></button>
          <button type="button" onClick={() => scrollToAdminSection('admin-applications')}><ClipboardList size={16} /><span>{copy.applications}</span></button>
          <button type="button" onClick={() => scrollToAdminSection('admin-access')}><Shield size={16} /><span>{copy.memberAccess}</span></button>
          <button type="button" onClick={() => scrollToAdminSection('admin-roster')}><Users size={16} /><span>{copy.manageRoster}</span></button>
          <button type="button" onClick={() => scrollToAdminSection('admin-audit')}><History size={16} /><span>{copy.adminDashboard}</span></button>
        </nav>
        {error && <p className="form-error" role="alert">{error}</p>}

        <section className="admin-block news-admin-block" id="admin-news">
          <h3><Megaphone size={18} />{copy.manageNews}</h3>
          <form className="admin-form news-admin-form" key={editingNews?.id ?? 'new-news'} onSubmit={saveNews}>
            <p className="admin-form-hint">{copy.translationHint}</p>
            <label>{copy.newsHeadline}<input required maxLength={120} value={newsOriginal.title} onChange={(event) => setNewsOriginal((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className="news-body-field">{copy.newsBody}<textarea required rows={5} maxLength={2000} value={newsOriginal.body} onChange={(event) => setNewsOriginal((current) => ({ ...current, body: event.target.value }))} /></label>
            <label className="news-images-field"><span><ImagePlus size={16} />{copy.newsImages}</span><input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={newsImagePaths.length + newsImageFiles.length >= 4} onChange={(event) => { selectNewsImages(event.target.files); event.target.value = '' }} /></label>
            {(newsImagePaths.length > 0 || newsImageFiles.length > 0) && <div className="news-image-selection">
              {newsImagePaths.map((path, index) => <div key={path}><img src={getBoardNewsImageUrl(path)} alt={`${newsOriginal.title} ${index + 1}`} /><button type="button" title={copy.delete} onClick={() => setNewsImagePaths((current) => current.filter((item) => item !== path))}><X size={14} /></button></div>)}
              {newsImageFiles.map((image) => <NewsImagePreview image={image} title={newsOriginal.title} removeLabel={copy.delete} onRemove={() => setNewsImageFiles((current) => current.filter((item) => item.id !== image.id))} key={image.id} />)}
            </div>}
            <label>{copy.priority}<select name="priority" defaultValue={editingNews?.priority ?? 'standard'}><option value="standard">{copy.standard}</option><option value="important">{copy.important}</option><option value="critical">{copy.critical}</option></select></label>
            <label className="server-time-field"><span>{copy.expiresOn}</span><input name="expiresAt" type="datetime-local" defaultValue={toDateTimeInput(editingNews?.expires_at ?? null)} /><small>{copy.gameServerTime}</small></label>
            <label className="check-field"><input name="published" type="checkbox" defaultChecked={editingNews?.published ?? true} />{copy.publishNow}</label>
            {!editingNews && <label className="check-field"><input name="notifyMembers" type="checkbox" />{copy.notifyMembers}</label>}
            <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{editingNews ? copy.save : copy.createNews}</button>{editingNews && <button className="ghost-button" type="button" onClick={resetNewsEditor}>{copy.cancel}</button>}</div>
          </form>

          <div className="access-tabs" role="tablist" aria-label={copy.newsHistory}>{(['active', 'expired', 'archived'] as const).map((filter) => <button type="button" role="tab" aria-selected={newsFilter === filter} className={newsFilter === filter ? 'active' : ''} onClick={() => setNewsFilter(filter)} key={filter}>{filter === 'active' ? copy.active : filter === 'archived' ? copy.archive : copy.expiresOn}</button>)}</div>
          <div className="admin-list news-admin-list">{filteredNews.map((news) => {
            const translation = news.translations[language] ?? news.translations[news.default_language] ?? Object.values(news.translations)[0]
            const endedAt = news.archived_at ?? news.expires_at
            return <article data-priority={news.priority} key={news.id}><div><strong>{translation?.title}</strong><small>{news.archived_at ? copy.archive : news.published ? copy.publishedOn : copy.draft}</small></div>
              <p>{translation?.body}</p><small>{copy.createdOn}: {new Date(news.created_at).toLocaleString(language)}</small>{endedAt && <small>{copy.expiresOn} · {copy.gameServerTime}: {formatGameServerTime(endedAt, language)}</small>}
              <div className="row-actions"><button className="compact-button" type="button" onClick={() => editNews(news)}><Pencil size={14} />{copy.editNews}</button>{news.published && <button className="compact-button" type="button" onClick={() => toggleNewsArchive(news)}>{news.archived_at ? <RotateCcw size={14} /> : <Archive size={14} />}{news.archived_at ? copy.restore : copy.archive}</button>}{news.archived_at && <button className="compact-button danger" type="button" onClick={() => void deleteArchivedNews(news)}><Trash2 size={14} />{copy.delete}</button>}</div>
            </article>
          })}</div>
        </section>

        <section className="admin-block" id="admin-create-poll">
          <h3><Plus size={18} />{copy.createPoll}</h3>
          <form className="admin-form" onSubmit={createPoll}>
            <label>{copy.question}<input name="question" required minLength={5} maxLength={240} /></label>
            <label>{copy.options}<textarea name="options" required rows={4} placeholder={'Option 1\nOption 2'} /></label>
            <label>{copy.closingDate}<input name="closesAt" type="datetime-local" /></label>
            <label className="check-field"><input name="notifyMembers" type="checkbox" />{copy.notifyMembers}</label>
            <button className="primary-button" type="submit" disabled={busy}>{copy.publish}</button>
          </form>
        </section>

        <section className="admin-block" id="admin-polls"><h3>{copy.pollsTitle}</h3>
          <div className="access-tabs" role="tablist" aria-label={copy.pollsTitle}>{(['all', 'active', 'closed'] as const).map((filter) => <button type="button" role="tab" aria-selected={pollFilter === filter} className={pollFilter === filter ? 'active' : ''} onClick={() => setPollFilter(filter)} key={filter}>{filter === 'all' ? copy.pollsTitle : filter === 'active' ? copy.active : copy.deactivate}</button>)}</div>
          <div className="admin-list">{filteredPolls.map((poll) => {
            const voteCount = poll.poll_options.reduce((total, option) => total + option.voteCount, 0)
            const isEditing = editingPoll?.id === poll.id
            return <article key={poll.id}>{isEditing
              ? <form className="admin-form" onSubmit={updatePoll}>
                <label>{copy.question}<input name="question" required minLength={5} maxLength={240} defaultValue={poll.question} /></label>
                <label>{copy.options}<textarea name="options" required rows={4} disabled={voteCount > 0} defaultValue={poll.poll_options.map((option) => option.label).join('\n')} /></label>
                {voteCount > 0 && <small>{copy.optionsLockedAfterVoting}</small>}
                <label>{copy.closingDate}<input name="closesAt" type="datetime-local" defaultValue={toDateTimeInput(poll.closes_at)} /></label>
                <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{copy.save}</button><button className="ghost-button" type="button" onClick={() => setEditingPoll(null)}>{copy.cancel}</button></div>
              </form>
              : <><div><strong>{poll.question}</strong><small>{voteCount} {copy.votes}</small></div>
                <ul>{poll.poll_options.map((option) => <li key={option.id}>{option.label}<b>{option.voteCount}</b></li>)}</ul>
                <div className="row-actions">{poll.active && <button className="compact-button" type="button" onClick={() => setEditingPoll(poll)}><Pencil size={14} />{copy.editPoll}</button>}<button className="compact-button" type="button" onClick={() => togglePoll(poll)}>{poll.active ? copy.deactivate : copy.activate}</button>{!poll.active && <button className="compact-button danger" type="button" onClick={() => void deletePoll(poll)}><Trash2 size={14} />{copy.delete}</button>}</div></>}
            </article>
          })}</div>
        </section>

        <section className="admin-block" id="admin-applications"><h3>{copy.applications}</h3>
          <div className="admin-list">{applications.map((application) => <article key={application.id}><div><strong>{application.profiles?.member_name}</strong><small>{application.status}</small></div><p>{application.reason}</p><p>{application.experience}</p><small>{application.availability}</small>
            <div className="row-actions">{application.status === 'pending' && <><button className="compact-button" onClick={() => updateApplication(application, 'approved')}><Check size={14} />{copy.approve}</button><button className="compact-button danger" onClick={() => updateApplication(application, 'rejected')}><X size={14} />{copy.reject}</button></>}<button className="compact-button danger" onClick={() => void deleteApplication(application)}><Trash2 size={14} />{copy.delete}</button></div></article>)}</div>
        </section>

        <section className="admin-block member-access-admin" id="admin-access"><h3>{copy.memberAccess}</h3>
          <div className="access-tabs" role="tablist" aria-label={copy.memberAccess}>
            {(['pending', 'approved', 'inactive'] as const).map((filter) => <button type="button" role="tab" aria-selected={accessFilter === filter} className={accessFilter === filter ? 'active' : ''} onClick={() => setAccessFilter(filter)} key={filter}>
              {filter === 'pending' ? copy.accessPending : filter === 'approved' ? copy.accessApproved : copy.accessInactive}<span>{accessProfiles[filter].length}</span>
            </button>)}
          </div>
          <label className="roster-admin-search member-access-search"><Search size={17} /><input type="search" value={accessQuery} onChange={(event) => setAccessQuery(event.target.value)} placeholder={copy.searchAccounts} /></label>
          <div className="member-access-list member-access-scroll" role="list">{filteredAccessProfiles.map((member) => <div role="listitem" key={member.id}>
            <span><strong>{member.member_name}</strong><small>{member.role} · {accessFilter === 'pending' ? copy.accessPending : accessFilter === 'approved' ? copy.accessApproved : copy.accessInactive}</small></span>
            {member.id === profile.id
              ? <small className="current-account">{copy.currentAccount}</small>
              : <span className="row-actions">{accessFilter === 'pending'
                ? <><button className="compact-button" onClick={() => reviewRegistration(member, 'approved')}><Check size={14} />{copy.approve}</button><button className="compact-button danger" onClick={() => reviewRegistration(member, 'rejected')}><X size={14} />{copy.reject}</button></>
                : <>{member.registration_status === 'rejected'
                  ? <button className="compact-button" onClick={() => reviewRegistration(member, 'approved')}><Check size={14} />{copy.approve}</button>
                  : <>{(member.role === 'admin' || member.active) && <button className="compact-button" type="button" onClick={() => void updateMemberRole(member)}><Shield size={14} />{member.role === 'admin' ? copy.demoteToMember : copy.promoteToAdmin}</button>}<button className="compact-button" onClick={() => toggleMember(member)}>{member.active ? copy.deactivate : copy.activate}</button></>}
                  {!member.active && member.role === 'member' && <button className="compact-button danger" type="button" onClick={() => void deleteInactiveAccount(member)}><Trash2 size={14} />{copy.delete}</button>}</>}
              </span>}
          </div>)}
            {filteredAccessProfiles.length === 0 && <p className="access-empty">{accessQuery ? copy.noAccessResults : accessFilter === 'pending' ? copy.noRegistrations : copy.noAccessResults}</p>}
          </div>
        </section>

        <section className="admin-block" id="admin-roster"><div className="admin-block-heading"><h3>{copy.manageRoster}</h3><button className="compact-button" type="button" disabled={busy} onClick={() => void exportRosterStatistics()}><FileSpreadsheet size={16} />{copy.exportStatistics}</button></div>
          <div className="performance-indicators">
            <div><TrendingUp size={18} /><span>{copy.membersPowerIncreased}</span><strong>{indicators.filter((item) => item.combat_power_change > 0).length}</strong></div>
            <div><TrendingDown size={18} /><span>{copy.membersPerformanceDeclined}</span><strong>{indicators.filter((item) => item.combat_power_change < 0 || item.kills_change < 0 || item.contribution_change < 0).length}</strong></div>
            <div><History size={18} /><span>{copy.membersNotUpdated}</span><strong>{indicators.filter((item) => item.days_since_update > 14).length}</strong></div>
          </div>
          {performanceMember && <form className="performance-entry-form" key={`${performanceMember.id}:${performanceDefaults?.recorded_at ?? 'new'}`} onSubmit={savePerformance}>
            <div className="performance-entry-heading"><div><small>{copy.recordPerformance}</small><strong>{performanceMember.member_name}</strong></div><button className="icon-button" type="button" title={copy.close} onClick={() => setPerformanceMember(null)}><X size={15} /></button></div>
            <p>{copy.sundayRecommended}</p>
            <label>{copy.snapshotDate}<input name="snapshotDate" type="date" required max={todayUtc()} defaultValue={todayUtc()} /></label>
            <label>{copy.combatPower}<LocalizedIntegerInput name="combatPower" language={language} defaultValue={performanceMember.combat_power} /></label>
            <label>{copy.kills}<LocalizedIntegerInput name="kills" language={language} defaultValue={performanceMember.kills} /></label>
            <label>{copy.weeklyContribution}<LocalizedIntegerInput name="weeklyContribution" language={language} defaultValue={performanceMember.weekly_contribution} /></label>
            {[1, 2, 3, 4].map((number) => <label key={number}>{copy.formation} {number}<LocalizedIntegerInput name={`formation${number}`} language={language} defaultValue={performanceDefaults?.[`formation_${number}` as keyof MemberPerformanceSnapshot] as number ?? 0} /></label>)}
            <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{copy.saveSnapshot}</button><button className="ghost-button" type="button" onClick={() => setPerformanceMember(null)}>{copy.cancel}</button></div>
          </form>}
          <form className="admin-form roster-form" key={editingMember?.id ?? 'new'} onSubmit={saveMember}>
            <label>{copy.memberName}<input name="memberName" required maxLength={60} defaultValue={editingMember?.member_name} /></label>
            <label>{copy.rank}<select name="rank" required defaultValue={editingMember?.rank ?? 'R3'}>{['R1', 'R2', 'R3', 'R4', 'R5'].map((rank) => <option key={rank}>{rank}</option>)}</select></label>
            <label>{copy.playerLevel}<input name="playerLevel" type="number" required min={1} max={10} defaultValue={editingMember?.player_level ?? 1} /></label>
            {!editingMember && <><label>{copy.combatPower}<LocalizedIntegerInput name="combatPower" language={language} defaultValue={0} /></label>
              <label>{copy.kills}<LocalizedIntegerInput name="kills" language={language} defaultValue={0} /></label>
              <label>{copy.weeklyContribution}<LocalizedIntegerInput name="weeklyContribution" language={language} defaultValue={0} /></label></>}
            <label className="check-field"><input name="active" type="checkbox" defaultChecked={editingMember?.active ?? true} />{copy.active}</label>
            <div className="row-actions"><button className="primary-button" type="submit" disabled={busy}>{editingMember ? copy.save : copy.addMember}</button>{editingMember && <button className="ghost-button" type="button" onClick={() => setEditingMember(null)}>{copy.cancel}</button>}</div>
          </form>
          <div className="roster-admin-filters"><label className="roster-admin-search"><Search size={17} /><input type="search" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder={copy.search} /></label><select aria-label={copy.rank} value={memberRank} onChange={(event) => setMemberRank(event.target.value)}><option value="ALL">{copy.rank}</option>{['R1','R2','R3','R4','R5'].map((rank) => <option key={rank}>{rank}</option>)}</select><select aria-label={copy.active} value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}><option value="ALL">{copy.rosterAll}</option><option value="active">{copy.rosterActive}</option><option value="inactive">{copy.rosterInactive}</option></select><select aria-label={copy.lastUpdate} value={memberFreshness} onChange={(event) => setMemberFreshness(event.target.value)}><option value="ALL">{copy.lastUpdate}</option><option value="fresh">≤ 14d</option><option value="stale">&gt; 14d</option></select></div>
          <div className="member-access-list roster-admin-list">{filteredAdminMembers.map((member) => { const login = memberLoginById.get(member.id); return <div key={member.id}><span><strong>{member.member_name}</strong><small>{member.rank} · Lv. {member.player_level} · {member.combat_power.toLocaleString()} · {member.active ? copy.active : copy.deactivate}</small><small>{copy.lastUpdate}: {member.performance_updated_at ? new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(member.performance_updated_at)) : copy.neverUpdated}</small><small>{copy.lastPortalLogin}: {!login?.account_id ? copy.noLinkedAccount : login.last_sign_in_at ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(login.last_sign_in_at)) : copy.neverSignedIn}</small></span><span className="row-actions"><button className="icon-button performance-button" type="button" title={copy.recordPerformance} onClick={() => void openPerformanceEditor(member)}><Activity size={15} /></button><button className="icon-button" type="button" title={copy.editMember} onClick={() => setEditingMember(member)}><Pencil size={15} /></button><button className="icon-button danger" type="button" title={copy.delete} onClick={() => deleteMember(member)}><Trash2 size={15} /></button></span></div> })}</div>
        </section>
        <section className="admin-block" id="admin-audit"><h3><History size={18} />{copy.adminDashboard} · {copy.performanceHistory}</h3><div className="admin-list audit-list">{auditEvents.map((event) => <article key={event.id}><div><strong>{event.resource_kind} · {event.action}</strong><small>{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at))}</small></div><small>{event.actor_id ? profiles.find((item) => item.id === event.actor_id)?.member_name ?? event.actor_id : 'system'}{event.resource_id ? ` · ${event.resource_id}` : ''}</small></article>)}</div></section>
      </div>}
      {error && profile?.role !== 'admin' && <p className="form-error" role="alert">{error}</p>}
    </section>
  </div>
}
