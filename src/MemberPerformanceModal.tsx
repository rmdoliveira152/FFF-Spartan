import { useEffect, useEffectEvent, useState } from 'react'
import { Activity, LogIn, TrendingUp, X } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type Copy, type Language } from './i18n'
import { supabase, type AllianceMember, type MemberPerformanceSnapshot } from './supabase'

type Props = {
  member: AllianceMember | null
  copy: Copy
  language: Language
  canView: boolean
  onClose: () => void
  onSignIn: () => void
}

const compactPower = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export function MemberPerformanceModal({ member, copy, language, canView, onClose, onSignIn }: Props) {
  const [history, setHistory] = useState<MemberPerformanceSnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    if (!member || !canView || !supabase) return
    setLoading(true)
    setError('')
    const { data, error: historyError } = await supabase.rpc('member_performance_history', { requested_member: member.id })
    if (historyError) setError(historyError.message)
    else setHistory((data ?? []) as MemberPerformanceSnapshot[])
    setLoading(false)
  }
  const loadHistoryEvent = useEffectEvent(loadHistory)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Loading starts only after the external RPC is requested.
    if (member && canView) void loadHistoryEvent()
  }, [member, canView])

  if (!member) return null
  const first = history[0]
  const latest = history.at(-1)
  const growth = first && latest ? latest.combat_power - first.combat_power : 0
  const growthPercent = first?.combat_power ? growth / first.combat_power * 100 : 0
  const chartData = history.map((snapshot) => ({
    ...snapshot,
    date: new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short' }).format(new Date(`${snapshot.snapshot_date}T12:00:00`)),
  }))

  return <div className="modal-backdrop performance-backdrop" onMouseDown={onClose}>
    <section className="performance-modal" role="dialog" aria-modal="true" aria-labelledby="performance-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="close-button" type="button" onClick={onClose} aria-label={copy.close}><X /></button>
      <header><Activity size={30} /><div><small>{copy.performanceHistory}</small><h2 id="performance-title">{member.member_name}</h2><p>{member.rank} · Lv. {member.player_level}</p></div></header>
      {!canView ? <div className="performance-gate"><LogIn size={30} /><p>{copy.signInForHistory}</p><button className="primary-button" type="button" onClick={onSignIn}>{copy.login}</button></div> : <>
        <div className="performance-summary">
          <div><span>{copy.currentPower}</span><strong>{(latest?.combat_power ?? member.combat_power).toLocaleString(language)}</strong></div>
          <div><span>{copy.growthPeriod}</span><strong className={growth < 0 ? 'negative' : ''}><TrendingUp size={18} />{growth >= 0 ? '+' : ''}{compactPower(growth)} <small>({growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%)</small></strong></div>
          <div><span>{copy.lastUpdate}</span><strong>{member.performance_updated_at ? new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(member.performance_updated_at)) : copy.neverUpdated}</strong></div>
        </div>
        {loading && <p className="performance-empty">...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && history.length === 0 && <p className="performance-empty">{copy.noPerformanceHistory}</p>}
        {!loading && history.length > 0 && <>
          <div className="performance-chart" aria-label={copy.currentPower}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#2c3531" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#879088" fontSize={11} />
                <YAxis stroke="#879088" fontSize={11} tickFormatter={compactPower} width={58} />
                <Tooltip formatter={(value) => Number(value).toLocaleString(language)} contentStyle={{ background: '#171d1b', border: '1px solid #3a4540' }} />
                <Line type="monotone" dataKey="combat_power" name={copy.combatPower} stroke="#ed3833" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="performance-chart" aria-label={copy.formation}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#2c3531" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#879088" fontSize={11} />
                <YAxis stroke="#879088" fontSize={11} tickFormatter={compactPower} width={58} />
                <Tooltip formatter={(value) => Number(value).toLocaleString(language)} contentStyle={{ background: '#171d1b', border: '1px solid #3a4540' }} />
                <Legend />
                {[1, 2, 3, 4].map((number, index) => <Line type="monotone" dataKey={`formation_${number}`} name={`${copy.formation} ${number}`} stroke={['#f1b84b', '#59a6d8', '#70b77e', '#b58bd3'][index]} strokeWidth={2} dot={{ r: 2 }} key={number} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>}
      </>}
    </section>
  </div>
}