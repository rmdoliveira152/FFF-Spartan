import { useState } from 'react'
import { ChevronDown, Languages } from 'lucide-react'
import type { Copy, Language } from './i18n'
import type { AdminAuditEvent } from './supabase'

type Props = {
  event: AdminAuditEvent
  actorName: string
  subjectName: string | null
  copy: Copy
  language: Language
}

type AuditRow = Record<string, unknown>

const allowedFields: Record<string, string[]> = {
  profiles: ['member_name', 'role', 'active', 'registration_status', 'notify_poll_emails', 'notify_news_emails'],
  alliance_members: ['member_name', 'rank', 'player_level', 'combat_power', 'kills', 'weekly_contribution', 'active', 'performance_updated_at'],
  polls: ['question', 'active', 'closes_at'],
  board_news: ['priority', 'published', 'published_at', 'expires_at', 'archived_at'],
  r4_applications: ['status'],
  member_performance_snapshots: ['snapshot_date', 'combat_power', 'kills', 'weekly_contribution', 'formation_1', 'formation_2', 'formation_3', 'formation_4'],
}

const englishLabels: Record<string, string> = {
  member_name: 'Member name', role: 'Role', active: 'Active', registration_status: 'Registration status',
  notify_poll_emails: 'Poll email notifications', notify_news_emails: 'News email notifications', rank: 'Rank',
  player_level: 'Player level', combat_power: 'Combat power', kills: 'Kills', weekly_contribution: 'Weekly contribution',
  performance_updated_at: 'Last performance update', question: 'Question', closes_at: 'Closing date', priority: 'Priority',
  published: 'Published', published_at: 'Published on', expires_at: 'Expires on', archived_at: 'Archived on', status: 'Status',
  snapshot_date: 'Snapshot date', formation_1: 'Formation 1', formation_2: 'Formation 2', formation_3: 'Formation 3', formation_4: 'Formation 4',
}

function localizedLabel(field: string, copy: Copy) {
  const labels: Record<string, string> = {
    member_name: copy.memberName, role: copy.role, active: copy.active, registration_status: copy.registrationStatus,
    notify_poll_emails: copy.notifyPollEmails, notify_news_emails: copy.notifyNewsEmails, rank: copy.rank,
    player_level: copy.playerLevel, combat_power: copy.combatPower, kills: copy.kills, weekly_contribution: copy.weeklyContribution,
    performance_updated_at: copy.lastUpdate, question: copy.question, closes_at: copy.closingDate, priority: copy.priority,
    published: copy.publish, published_at: copy.publishedOn, expires_at: copy.expiresOn, archived_at: copy.archive, status: copy.registrationStatus,
    snapshot_date: copy.snapshotDate, formation_1: `${copy.formation} 1`, formation_2: `${copy.formation} 2`,
    formation_3: `${copy.formation} 3`, formation_4: `${copy.formation} 4`,
  }
  return labels[field] ?? englishLabels[field] ?? field
}

function formatValue(value: unknown, language: Language, copy: Copy) {
  if (value === null || value === undefined || value === '') return copy.auditEmptyValue
  if (typeof value === 'boolean') return value ? copy.auditYes : copy.auditNo
  if (typeof value === 'number') return value.toLocaleString(language)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat(language, { dateStyle: 'medium', ...(value.includes('T') ? { timeStyle: 'short' as const } : {}) }).format(date)
  }
  return String(value)
}

function auditRows(event: AdminAuditEvent) {
  const changes = event.changes as { before?: AuditRow | null; after?: AuditRow | null }
  const before = changes.before ?? {}
  const after = changes.after ?? {}
  return (allowedFields[event.resource_kind] ?? [])
    .filter((field) => event.action !== 'update' || JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .filter((field) => before[field] !== undefined || after[field] !== undefined)
    .map((field) => ({ field, before: before[field], after: after[field] }))
}

export function AuditEventCard({ event, actorName, subjectName, copy, language }: Props) {
  const [translated, setTranslated] = useState(language === 'en')
  const summaryLanguage = translated ? language : 'en'
  const rows = auditRows(event)

  return <details className="audit-card">
    <summary>
      <span><strong>{event.resource_kind} · {event.action}</strong>{subjectName && <small className="audit-subject"><b>{copy.member}:</b> {subjectName}</small>}<small>{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at))}</small></span>
      <span className="audit-card-meta"><small>{actorName}</small><ChevronDown size={17} /></span>
    </summary>
    <div className="audit-summary-popover">
      <strong>{translated ? copy.auditSummary : 'Change summary'}</strong>
      {subjectName && <p className="audit-summary-subject"><b>{translated ? copy.member : 'Member'}:</b> {subjectName}</p>}
      {rows.length ? <ul>{rows.map(({ field, before, after }) => <li key={field}>
        <b>{translated ? localizedLabel(field, copy) : englishLabels[field] ?? field}</b>
        <span>{event.action === 'update' ? `${formatValue(before, summaryLanguage, copy)} → ${formatValue(after, summaryLanguage, copy)}` : formatValue(event.action === 'delete' ? before : after, summaryLanguage, copy)}</span>
      </li>)}</ul> : <p>{translated ? copy.auditNoDetails : 'No additional details available.'}</p>}
      {language !== 'en' && <button className="compact-button" type="button" onClick={() => setTranslated((current) => !current)}><Languages size={14} />{translated ? copy.viewOriginal : copy.translateNews}</button>}
    </div>
  </details>
}