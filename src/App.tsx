import { useMemo, useState, type FormEvent } from 'react'
import { ChevronRight, ExternalLink, Globe2, LogIn, Menu, Search, Shield, Swords, Users, Vote, X } from 'lucide-react'
import { getCopy, languages, type Language } from './i18n'
import { AdminPortal } from './AdminPortal'
import { usePortal } from './usePortal'
import './App.css'

type Metric = 'combatPower' | 'kills' | 'weeklyContribution'
type AllianceRank = 'R5' | 'R4' | 'R3' | 'R2' | 'R1'

const members = [
  { name: 'SPARTAN ONE', rank: 'R5' as AllianceRank, combatPower: 184_600_000, kills: 9_420_300, weeklyContribution: 92_500 },
  { name: 'Valquíria', rank: 'R4' as AllianceRank, combatPower: 171_200_000, kills: 8_890_100, weeklyContribution: 96_800 },
  { name: 'ARES', rank: 'R4' as AllianceRank, combatPower: 165_900_000, kills: 8_110_400, weeklyContribution: 88_400 },
  { name: 'IronWolf', rank: 'R4' as AllianceRank, combatPower: 159_800_000, kills: 7_780_900, weeklyContribution: 84_700 },
  { name: 'Fenix', rank: 'R3' as AllianceRank, combatPower: 148_300_000, kills: 7_210_500, weeklyContribution: 79_200 },
  { name: 'MadMax', rank: 'R3' as AllianceRank, combatPower: 142_750_000, kills: 6_890_200, weeklyContribution: 76_100 },
  { name: 'Nyx', rank: 'R3' as AllianceRank, combatPower: 137_100_000, kills: 6_430_000, weeklyContribution: 81_900 },
  { name: 'GhostBR', rank: 'R2' as AllianceRank, combatPower: 126_400_000, kills: 5_720_300, weeklyContribution: 68_600 },
  { name: 'Ragnar', rank: 'R2' as AllianceRank, combatPower: 119_900_000, kills: 5_180_700, weeklyContribution: 64_300 },
  { name: 'Maverick', rank: 'R1' as AllianceRank, combatPower: 104_200_000, kills: 4_610_800, weeklyContribution: 55_200 },
]

const rankOrder: AllianceRank[] = ['R5', 'R4', 'R3', 'R2', 'R1']

function App() {
  const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('fff-language') as Language) || 'pt')
  const [metric, setMetric] = useState<Metric>('combatPower')
  const [rankFilter, setRankFilter] = useState<AllianceRank | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const portal = usePortal()
  const copy = getCopy(language)

  const roster = useMemo(() => members
    .filter((item) => rankFilter === 'ALL' || item.rank === rankFilter)
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => second[metric] - first[metric]), [metric, query, rankFilter])

  const changeLanguage = (value: Language) => {
    setLanguage(value)
    localStorage.setItem('fff-language', value)
    document.documentElement.lang = value
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr'
  }

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  const demoPolls = [
    { id: 'operation', question: copy.pollOperation, active: true, closes_at: null, poll_options: ['18:00 UTC', '20:00 UTC', '22:00 UTC'].map((label, index) => ({ id: `operation-${index}`, label, position: index + 1, voteCount: [15, 22, 11][index] })) },
    { id: 'training', question: copy.pollTraining, active: true, closes_at: null, poll_options: [copy.rallyCoordination, copy.defensiveFormations, copy.resourceEfficiency].map((label, index) => ({ id: `training-${index}`, label, position: index + 1, voteCount: [18, 10, 7][index] })) },
  ]
  const visiblePolls = portal.configured ? portal.polls : demoPolls

  const submitVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId]
    if (!optionId) return flash(copy.selectOption)
    if (!portal.configured) return flash(copy.portalUnavailable)
    if (!portal.user || !portal.profile?.active) {
      setAdminOpen(true)
      return flash(copy.loginRequired)
    }
    const result = await portal.vote(pollId, optionId)
    if (result.ok) flash(copy.successVote)
    else flash(result.message === 'DUPLICATE_VOTE' ? copy.duplicateVote : result.message)
  }

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!portal.configured) return flash(copy.portalUnavailable)
    if (!portal.user || !portal.profile?.active) {
      setAdminOpen(true)
      return flash(copy.loginRequired)
    }
    const form = new FormData(event.currentTarget)
    const result = await portal.submitApplication(String(form.get('reason')), String(form.get('experience')), String(form.get('availability')))
    if (result.ok) {
      flash(copy.successApply)
      event.currentTarget.reset()
    } else flash(result.message)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#command" aria-label="FFF-Spartan">
          <span className="brand-mark"><Shield size={22} fill="currentColor" /></span>
          <span><b>FFF</b><strong>SPARTAN</strong></span>
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'nav open' : 'nav'} onClick={() => setMenuOpen(false)}>
          <a href="#command">{copy.navHome}</a><a href="#roster">{copy.navRanks}</a><a href="#polls">{copy.navPolls}</a>
          <a href="#application">{copy.navR4}</a><a href="#code">{copy.navRules}</a>
        </nav>
        <div className="top-actions">
          <label className="language-picker"><Globe2 size={16} /><span className="sr-only">{copy.language}</span>
            <select value={language} onChange={(event) => changeLanguage(event.target.value as Language)}>
              {languages.map(([code, name]) => <option value={code} key={code}>{name}</option>)}
            </select>
          </label>
          <button className="admin-button" onClick={() => setAdminOpen(true)}><LogIn size={16} />{copy.admin}</button>
        </div>
      </header>

      <main>
        <section className="hero" id="command" style={{ backgroundImage: `url(${asset('wasteland.webp')})` }}>
          <div className="hero-shade" /><img className="survivor" src={asset('survivor.webp')} alt="" />
          <div className="hero-content">
            <p className="eyebrow"><span />{copy.eyebrow}</p><h1>FFF<span>SPARTAN</span></h1><h2>{copy.heroTitle}</h2>
            <p className="hero-copy">{copy.heroText}</p>
            <div className="hero-buttons"><a className="primary-button" href="#roster">{copy.enterRanks}<ChevronRight size={18} /></a>
              <a className="ghost-button" href="https://darkwar-survival.com/#/en/home" target="_blank" rel="noreferrer">{copy.officialGame}<ExternalLink size={16} /></a></div>
          </div>
          <div className="directive"><span>{copy.alertLabel}</span><p>{copy.alertText}</p></div>
        </section>

        <section className="values-strip" aria-label="Alliance values">
          <div><Swords /><b>{copy.strength}</b><small>01</small></div><div><Users /><b>{copy.unity}</b><small>02</small></div><div><Shield /><b>{copy.discipline}</b><small>03</small></div>
        </section>

        <section className="section roster-section" id="roster">
          <header className="section-header"><div><p className="eyebrow">{copy.rosterLabel}</p><h2>{copy.rosterTitle}</h2><p>{copy.rosterText}</p></div>
            <div className="section-stat"><strong>{members.length}</strong><span>{copy.members}<br />{copy.updated}</span></div></header>
          <div className="rank-filters" role="tablist"><button className={rankFilter === 'ALL' ? 'active' : ''} onClick={() => setRankFilter('ALL')}>ALL</button>
            {rankOrder.map((rank) => <button className={rankFilter === rank ? 'active' : ''} onClick={() => setRankFilter(rank)} key={rank}>{rank}</button>)}</div>
          <div className="data-toolbar"><div className="metric-tabs">{(['combatPower', 'kills', 'weeklyContribution'] as Metric[]).map((item) =>
            <button className={metric === item ? 'active' : ''} onClick={() => setMetric(item)} key={item}>{copy[item]}</button>)}</div>
            <label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label></div>
          <div className="ranking-table"><div className="table-head"><span>#</span><span>{copy.member}</span><span>{copy.role}</span><span>{copy[metric]}</span></div>
            {roster.map((item, index) => <div className="member-row" key={item.name}><span className="position">{String(index + 1).padStart(2, '0')}</span>
              <span className="member-name"><i>{item.name.slice(0, 2)}</i><b>{item.name}</b></span><span><em className={`rank rank-${item.rank.toLowerCase()}`}>{item.rank}</em></span>
              <strong>{item[metric].toLocaleString(language)}</strong></div>)}</div>
        </section>

        <section className="section polls-section" id="polls">
          <header className="section-header light"><div><p className="eyebrow">{copy.pollsLabel}</p><h2>{copy.pollsTitle}</h2><p>{copy.pollsText}</p></div><Vote size={46} /></header>
          {!portal.loading && visiblePolls.length === 0 && <p className="empty-state">{copy.noPolls}</p>}
          <div className="poll-grid">{visiblePolls.map((poll) => {
            const totalVotes = poll.poll_options.reduce((total, option) => total + option.voteCount, 0)
            return <article className="poll-card" key={poll.id}><div className="poll-meta"><span>{copy.active}</span><small>{totalVotes} {copy.votes}</small></div><h3>{poll.question}</h3>
              {poll.poll_options.map((option) => <label className="poll-option" key={option.id}><input type="radio" name={`poll-${poll.id}`} checked={selectedOptions[poll.id] === option.id} onChange={() => setSelectedOptions((current) => ({ ...current, [poll.id]: option.id }))} /><span>{option.label}</span><b>{totalVotes ? Math.round(option.voteCount / totalVotes * 100) : 0}%</b></label>)}
              <button className="primary-button" onClick={() => void submitVote(poll.id)}>{copy.vote}</button></article>
          })}</div>
        </section>

        <section className="section application-section" id="application">
          <div className="application-copy"><p className="eyebrow">{copy.applyLabel}</p><h2>{copy.applyTitle}</h2><p>{copy.applyText}</p><div className="spartan-number">R4</div></div>
          <form className="application-form" onSubmit={submitApplication}>
            <div className="signed-member"><span>{copy.selectMember}</span><strong>{portal.profile?.member_name ?? copy.loginRequired}</strong></div>
            <label>{copy.reason}<textarea name="reason" required minLength={10} placeholder={copy.reasonHint} rows={4} /></label><label>{copy.experience}<textarea name="experience" required minLength={10} placeholder={copy.experienceHint} rows={3} /></label>
            <label>{copy.availability}<input name="availability" required placeholder="18:00–23:00 UTC" /></label><button className="primary-button" type="submit">{copy.submit}<ChevronRight size={18} /></button>
          </form>
        </section>

        <section className="section code-section" id="code">
          <header className="section-header"><div><p className="eyebrow">{copy.rulesLabel}</p><h2>{copy.rulesTitle}</h2><p>{copy.rulesText}</p></div><Shield size={48} /></header>
          <div className="rules-grid">{copy.ruleItems.map((rule, index) => <article key={rule}><span>{String(index + 1).padStart(2, '0')}</span><p>{rule}</p></article>)}</div>
        </section>
      </main>

      <footer><div className="brand"><span className="brand-mark"><Shield size={20} /></span><span><b>FFF</b><strong>SPARTAN</strong></span></div><p>{copy.footer}<br /><small>{copy.fanNotice}{!portal.configured && ' · Preview data only.'}</small></p><img src={asset('dark-war-logo.png')} alt="Dark War: Survival" /></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
      <AdminPortal open={adminOpen} copy={copy} user={portal.user} profile={portal.profile} onClose={() => setAdminOpen(false)} onSignIn={portal.signIn} onSignOut={portal.signOut} onRefreshPolls={portal.refreshPolls} />
    </div>
  )
}

export default App
