import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Archive, Bell, CalendarDays, CalendarRange, CheckCheck, ChevronRight, ExternalLink, Globe2, Languages, LogIn, Megaphone, Menu, MessagesSquare, Radio, Search, Shield, Swords, TrendingUp, Users, Vote, X } from 'lucide-react'
import { getCopy, languages, type Language } from './i18n'
import { getDiscussionCopy } from './discussionCopy'
import { AdminPortal } from './AdminPortal'
import { Discussion } from './Discussion'
import { usePortal } from './usePortal'
import { getBoardNewsImageUrl, supabase, type AllianceMember, type BoardNews, type BoardNewsTranslation } from './supabase'
import './App.css'

type Metric = 'combat_power' | 'kills' | 'weekly_contribution'
type AllianceRank = 'R5' | 'R4' | 'R3' | 'R2' | 'R1'
type CodeAudience = 'players' | 'r4'
type PollTranslation = { question: string; options: Record<string, string> }

const demoMembers = [
  { id: 'demo-1', member_name: 'SPARTAN ONE', rank: 'R5' as AllianceRank, player_level: 10, combat_power: 184_600_000, kills: 9_420_300, weekly_contribution: 92_500, active: true, performance_updated_at: null },
  { id: 'demo-2', member_name: 'Valquíria', rank: 'R4' as AllianceRank, player_level: 9, combat_power: 171_200_000, kills: 8_890_100, weekly_contribution: 96_800, active: true, performance_updated_at: null },
]

const rankOrder: AllianceRank[] = ['R5', 'R4', 'R3', 'R2', 'R1']
const codeAudiences: CodeAudience[] = ['players', 'r4']
const codeRuleIndexes: Record<CodeAudience, number[]> = {
  players: [0, 3, 4, 6, 7],
  r4: [0, 1, 2, 3, 4, 5, 6, 7],
}
const initialClock = Date.now()
const notificationHeadings: Record<Language, [string, string]> = {
  en:['Notifications','Mark all read'],pt:['Notificações','Marcar tudo como lido'],es:['Notificaciones','Marcar todo como leído'],fr:['Notifications','Tout marquer comme lu'],de:['Benachrichtigungen','Alle als gelesen markieren'],it:['Notifiche','Segna tutto come letto'],pl:['Powiadomienia','Oznacz wszystkie jako przeczytane'],ru:['Уведомления','Отметить все прочитанными'],tr:['Bildirimler','Tümünü okundu işaretle'],id:['Notifikasi','Tandai semua sudah dibaca'],vi:['Thông báo','Đánh dấu tất cả đã đọc'],th:['การแจ้งเตือน','ทำเครื่องหมายว่าอ่านแล้วทั้งหมด'],ja:['通知','すべて既読にする'],ko:['알림','모두 읽음으로 표시'],ar:['الإشعارات','تحديد الكل كمقروء'],'zh-CN':['通知','全部标为已读'],'zh-TW':['通知','全部標示為已讀'],
}
const MemberPerformanceModal = lazy(() => import('./MemberPerformanceModal').then((module) => ({ default: module.MemberPerformanceModal })))

const getOriginalNews = (news: BoardNews): BoardNewsTranslation => {
  const translations = news.translations
  return translations[news.default_language]
    ?? translations.en
    ?? translations.pt
    ?? Object.values(translations)[0]
    ?? { title: '', body: '' }
}

function App() {
  const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('fff-language') as Language) || 'en')
  const [metric, setMetric] = useState<Metric>('combat_power')
  const [rankFilter, setRankFilter] = useState<AllianceRank | 'ALL'>('ALL')
  const [codeAudience, setCodeAudience] = useState<CodeAudience>('players')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [performanceMember, setPerformanceMember] = useState<AllianceMember | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(0)
  const [clock, setClock] = useState(initialClock)
  const [notice, setNotice] = useState('')
  const [newsTranslations, setNewsTranslations] = useState<Record<string, BoardNewsTranslation>>({})
  const [newsSourceLanguages, setNewsSourceLanguages] = useState<Record<string, string>>({})
  const [translatingNews, setTranslatingNews] = useState<string | null>(null)
  const [newsTranslationErrors, setNewsTranslationErrors] = useState<Record<string, string>>({})
  const [pollTranslations, setPollTranslations] = useState<Record<string, PollTranslation>>({})
  const [pollSourceLanguages, setPollSourceLanguages] = useState<Record<string, string>>({})
  const [translatingPoll, setTranslatingPoll] = useState<string | null>(null)
  const [pollTranslationErrors, setPollTranslationErrors] = useState<Record<string, string>>({})
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [newsSeenAt, setNewsSeenAt] = useState(() => localStorage.getItem('fff-news-seen-at') ?? '')
  const [pollsSeenAt, setPollsSeenAt] = useState(() => localStorage.getItem('fff-polls-seen-at') ?? '')
  const portal = usePortal()
  const copy = getCopy(language)
  const discussionCopy = getDiscussionCopy(language)
  const unreadNotifications = portal.notifications.filter((notification) => !notification.read_at).length
  const notificationLabel = (kind: string) => {
    if (kind === 'poll_created') return copy.createPoll
    if (kind === 'news_published') return copy.newsTitle
    if (kind === 'comment_posted') return discussionCopy.discussion
    if (kind === 'r4_approved') return `${copy.applications}: ${copy.approve}`
    if (kind === 'r4_rejected') return `${copy.applications}: ${copy.reject}`
    if (kind === 'registration_approved') return copy.registrationSent
    return copy.memberAccess
  }

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const members = portal.configured ? portal.members : demoMembers
  const roster = useMemo(() => members
    .filter((item) => rankFilter === 'ALL' || item.rank === rankFilter)
    .filter((item) => item.member_name.toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => second[metric] - first[metric]), [members, metric, query, rankFilter])

  const changeLanguage = (value: Language) => {
    setLanguage(value)
    localStorage.setItem('fff-language', value)
  }

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  const demoPolls = [
    { id: 'operation', question: copy.pollOperation, active: true, closes_at: null, created_at: new Date(initialClock).toISOString(), poll_options: ['18:00 UTC', '20:00 UTC', '22:00 UTC'].map((label, index) => ({ id: `operation-${index}`, label, position: index + 1, voteCount: [15, 22, 11][index], voterNames: [] })) },
    { id: 'training', question: copy.pollTraining, active: true, closes_at: null, created_at: new Date(initialClock).toISOString(), poll_options: [copy.rallyCoordination, copy.defensiveFormations, copy.resourceEfficiency].map((label, index) => ({ id: `training-${index}`, label, position: index + 1, voteCount: [18, 10, 7][index], voterNames: [] })) },
  ]
  const sourcePolls = portal.configured ? portal.polls : demoPolls
  const visiblePolls = sourcePolls.map((poll) => {
    const translationKey = `${poll.id}:${language}`
    const translation = pollTranslations[translationKey]
    const sourceLanguage = pollSourceLanguages[poll.id] ?? 'und'
    return {
      ...poll,
      question: translation?.question ?? poll.question,
      poll_options: poll.poll_options.map((option) => ({ ...option, label: translation?.options[option.id] ?? option.label })),
      translationKey,
      isTranslated: Boolean(translation),
      canTranslate: portal.configured && (sourceLanguage === 'und' || sourceLanguage !== language),
    }
  })
  const canViewVoters = Boolean(portal.user && portal.profile?.active && portal.profile.registration_status === 'approved')
  const canAccessDiscussions = Boolean(portal.user && portal.profile?.active && (portal.profile.registration_status === 'approved' || portal.profile.role === 'admin'))
  const news = portal.boardNews.map((item) => {
    const translationKey = `${item.id}:${language}`
    const translated = newsTranslations[translationKey]
    const sourceLanguage = newsSourceLanguages[item.id] ?? item.default_language
    return {
      ...item,
      translation: translated ?? getOriginalNews(item),
      translationKey,
      isTranslated: Boolean(translated),
      canTranslate: sourceLanguage === 'und' || sourceLanguage !== language,
    }
  })
  const currentNews = news.filter((item) => !item.archived_at && (!item.expires_at || Date.parse(item.expires_at) > clock))
  const historicalNews = news.filter((item) => item.archived_at || (item.expires_at && Date.parse(item.expires_at) <= clock))
  const unreadNews = currentNews.filter((item) => !newsSeenAt || Date.parse(item.published_at) > Date.parse(newsSeenAt)).length
  const unreadPolls = visiblePolls.filter((poll) => !pollsSeenAt || Date.parse(poll.created_at) > Date.parse(pollsSeenAt)).length
  const formatNewsDate = (value: string) => new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

  const markNewsSeen = () => {
    const seenAt = new Date().toISOString()
    localStorage.setItem('fff-news-seen-at', seenAt)
    setNewsSeenAt(seenAt)
  }

  const markPollsSeen = () => {
    const seenAt = new Date().toISOString()
    localStorage.setItem('fff-polls-seen-at', seenAt)
    setPollsSeenAt(seenAt)
  }

  const translateNews = async (newsItem: BoardNews & { translationKey: string; isTranslated: boolean }) => {
    if (newsItem.isTranslated) {
      setNewsTranslations((current) => {
        const next = { ...current }
        delete next[newsItem.translationKey]
        return next
      })
      return
    }
    if (!supabase) return
    setTranslatingNews(newsItem.translationKey)
    setNewsTranslationErrors((current) => ({ ...current, [newsItem.id]: '' }))
    const { data, error } = await supabase.functions.invoke('translate-board-news', {
      body: { newsId: newsItem.id, targetLanguage: language },
    })
    if (error || !data?.translation) {
      setNewsTranslationErrors((current) => ({ ...current, [newsItem.id]: copy.translationFailed }))
    } else {
      setNewsSourceLanguages((current) => ({ ...current, [newsItem.id]: data.sourceLanguage ?? 'und' }))
      if (data.sourceLanguage !== language) {
        setNewsTranslations((current) => ({ ...current, [newsItem.translationKey]: data.translation }))
      }
    }
    setTranslatingNews(null)
  }

  const translatePoll = async (poll: { id: string; translationKey: string; isTranslated: boolean }) => {
    if (poll.isTranslated) {
      setPollTranslations((current) => {
        const next = { ...current }
        delete next[poll.translationKey]
        return next
      })
      return
    }
    if (!supabase) return
    setTranslatingPoll(poll.translationKey)
    setPollTranslationErrors((current) => ({ ...current, [poll.id]: '' }))
    const { data, error } = await supabase.functions.invoke('translate-poll', {
      body: { pollId: poll.id, targetLanguage: language },
    })
    if (error || !data?.translation) {
      setPollTranslationErrors((current) => ({ ...current, [poll.id]: copy.translationFailed }))
    } else {
      setPollSourceLanguages((current) => ({ ...current, [poll.id]: data.sourceLanguage ?? 'und' }))
      if (data.sourceLanguage !== language) {
        setPollTranslations((current) => ({ ...current, [poll.translationKey]: data.translation }))
      }
    }
    setTranslatingPoll(null)
  }

  const submitVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId]
    if (!optionId) return flash(copy.selectOption)
    if (!portal.configured) return flash(copy.portalUnavailable)
    if (!portal.user || !portal.profile?.active || portal.profile.registration_status !== 'approved') {
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
    if (!portal.user || !portal.profile?.active || portal.profile.registration_status !== 'approved') {
      setAdminOpen(true)
      return flash(copy.loginRequired)
    }
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const result = await portal.submitApplication(String(form.get('reason')), String(form.get('experience')), String(form.get('availability')), form.get('codeAgreement') === 'on')
    if (result.ok) {
      flash(copy.successApply)
      formElement.reset()
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
          <a href="#command">{copy.navHome}</a><a href="#news" className={unreadNews ? 'nav-new' : ''} onClick={markNewsSeen}>{copy.navNews}{unreadNews > 0 && <span>{unreadNews}</span>}</a><a href="#polls" className={unreadPolls ? 'nav-new' : ''} onClick={markPollsSeen}>{copy.navPolls}{unreadPolls > 0 && <span>{unreadPolls}</span>}</a><a href="#events">{copy.navEvents}</a><a href="#roster">{copy.navRanks}</a>
          <a href="#application">{copy.navR4}</a><a href="#code">{copy.navRules}</a>
          <a href="https://fff113.efferp.net/" target="_blank" rel="noreferrer"><Radio size={14} />RADIO-BUNKER</a>
        </nav>
        <div className="top-actions">
          <label className="language-picker"><Globe2 size={16} /><span className="sr-only">{copy.language}</span>
            <select value={language} onChange={(event) => changeLanguage(event.target.value as Language)}>
              {languages.map(([code, name]) => <option value={code} key={code}>{name}</option>)}
            </select>
          </label>
          {portal.user && <div className="notification-menu">
            <button className="notification-button" type="button" aria-label={notificationHeadings[language][0]} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((current) => !current)}><Bell size={17} />{unreadNotifications > 0 && <span>{unreadNotifications}</span>}</button>
            {notificationsOpen && <div className="notification-panel">
              <div><strong>{notificationHeadings[language][0]}</strong><button type="button" title={notificationHeadings[language][1]} onClick={() => void portal.markNotificationsRead()}><CheckCheck size={16} /></button></div>
              {portal.notifications.length === 0 ? <small>{copy.noAccessResults}</small> : portal.notifications.map((notification) => <a className={notification.read_at ? '' : 'unread'} href={notification.resource_kind === 'poll' || notification.resource_kind === 'polls' ? '#polls' : notification.resource_kind === 'board_news' ? '#news' : '#application'} onClick={() => setNotificationsOpen(false)} key={notification.id}><span>{notificationLabel(notification.event_kind)}</span><small>{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.created_at))}</small></a>)}
            </div>}
          </div>}
          <button className="admin-button" onClick={() => setAdminOpen(true)}>
            <LogIn size={16} />{!portal.user ? copy.login : portal.profile?.role === 'admin' ? copy.admin : copy.member}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="command" style={{ backgroundImage: `url(${asset('wasteland.webp')})` }}>
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow"><span />{copy.eyebrow}</p><h1>FFF<span>SPARTAN</span></h1><h2>{copy.heroTitle}</h2>
            <p className="hero-copy">{copy.heroText}</p>
            <div className="hero-buttons"><a className="primary-button" href="#roster">{copy.enterRanks}<ChevronRight size={18} /></a>
              <a className="ghost-button" href="https://discord.gg/V9QqspXxx" target="_blank" rel="noreferrer"><MessagesSquare size={16} />Discord</a>
              <a className="ghost-button" href="https://darkwar-survival.com/#/en/home" target="_blank" rel="noreferrer">{copy.officialGame}<ExternalLink size={16} /></a></div>
          </div>
          <div className="directive"><span>{copy.alertLabel}</span><p>{copy.alertText}</p></div>
        </section>

        <section className="values-strip" aria-label={`${copy.strength}, ${copy.unity}, ${copy.discipline}`}>
          <div><Swords /><b>{copy.strength}</b><small>01</small></div><div><Users /><b>{copy.unity}</b><small>02</small></div><div><Shield /><b>{copy.discipline}</b><small>03</small></div>
        </section>

        <section className="section board-news-section" id="news">
          <header className="section-header"><div><p className="eyebrow">{copy.newsLabel}</p><h2>{copy.newsTitle}</h2><p>{copy.newsIntro}</p></div><Megaphone size={48} /></header>
          <div className="board-news-grid">
            {currentNews.map((item, index) => <article className={`board-news-card ${index === 0 ? 'featured' : ''}`} data-priority={item.priority} key={item.id}>
              <div className="board-news-meta"><span>{copy[item.priority]}</span><time><CalendarDays size={14} />{copy.createdOn}: {formatNewsDate(item.created_at)}</time></div>
              <h3>{item.translation.title}</h3><p>{item.translation.body}</p>
              {item.image_paths.length > 0 && <div className="board-news-media">{item.image_paths.map((path, imageIndex) => <a href={getBoardNewsImageUrl(path)} target="_blank" rel="noreferrer" key={path}><img src={getBoardNewsImageUrl(path)} alt={`${item.translation.title} ${imageIndex + 1}`} loading={index === 0 && imageIndex === 0 ? 'eager' : 'lazy'} /></a>)}</div>}
              <Discussion kind="board_news" resourceId={item.id} language={language} copy={discussionCopy} canAccess={canAccessDiscussions} canPost={true} onSignIn={() => setAdminOpen(true)} />
              {item.canTranslate && <button className="news-translate-button" type="button" disabled={translatingNews === item.translationKey} onClick={() => void translateNews(item)}><Languages size={15} />{translatingNews === item.translationKey ? copy.translatingNews : item.isTranslated ? copy.viewOriginal : copy.translateNews}</button>}
              {newsTranslationErrors[item.id] && <small className="news-translation-error" role="alert">{newsTranslationErrors[item.id]}</small>}
              {item.expires_at && <div className="board-news-deadline"><span>{copy.expiresOn}</span><time>{formatNewsDate(item.expires_at)}</time></div>}
            </article>)}
            {!portal.loading && currentNews.length === 0 && <p className="board-news-empty">{copy.noNews}</p>}
          </div>
          {historicalNews.length > 0 && <div className="board-news-history">
            <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((current) => !current)}><Archive size={17} />{copy.newsHistory}<span>{historicalNews.length}</span></button>
            {historyOpen && <div className="history-list">{historicalNews.map((item) => <article key={item.id}><div><strong>{item.translation.title}</strong><small>{copy.createdOn}: {formatNewsDate(item.created_at)}</small></div><div className="history-news-content"><p>{item.translation.body}</p>{item.image_paths.length > 0 && <div className="board-news-media">{item.image_paths.map((path, imageIndex) => <a href={getBoardNewsImageUrl(path)} target="_blank" rel="noreferrer" key={path}><img src={getBoardNewsImageUrl(path)} alt={`${item.translation.title} ${imageIndex + 1}`} loading="lazy" /></a>)}</div>}<Discussion kind="board_news" resourceId={item.id} language={language} copy={discussionCopy} canAccess={canAccessDiscussions} canPost={false} onSignIn={() => setAdminOpen(true)} />{item.canTranslate && <button className="news-translate-button" type="button" disabled={translatingNews === item.translationKey} onClick={() => void translateNews(item)}><Languages size={15} />{translatingNews === item.translationKey ? copy.translatingNews : item.isTranslated ? copy.viewOriginal : copy.translateNews}</button>}{newsTranslationErrors[item.id] && <small className="news-translation-error" role="alert">{newsTranslationErrors[item.id]}</small>}</div><time>{copy.expiresOn}: {formatNewsDate(item.archived_at ?? item.expires_at!)}</time></article>)}</div>}
          </div>}
        </section>

        <section className="section polls-section" id="polls">
          <header className="section-header"><div><p className="eyebrow">{copy.pollsLabel}</p><h2>{copy.pollsTitle}</h2><p>{copy.pollsText}</p></div><Vote size={46} /></header>
          {!portal.loading && visiblePolls.length === 0 && <p className="empty-state">{copy.noPolls}</p>}
          <div className="poll-grid">{visiblePolls.map((poll) => {
            const totalVotes = poll.poll_options.reduce((total, option) => total + option.voteCount, 0)
            return <article className="poll-card" key={poll.id}><div className="poll-meta"><span>{copy.active}</span><small>{totalVotes} {copy.votes}</small></div><h3>{poll.question}</h3>
              {poll.poll_options.map((option) => {
                const showVoters = canViewVoters && Boolean(option.voterNames?.length)
                const tooltipId = `poll-voters-${option.id}`
                return <label className={`poll-option${showVoters ? ' has-voters' : ''}`} key={option.id}><input type="radio" name={`poll-${poll.id}`} checked={selectedOptions[poll.id] === option.id} aria-describedby={showVoters ? tooltipId : undefined} onChange={() => setSelectedOptions((current) => ({ ...current, [poll.id]: option.id }))} /><span>{option.label}</span><b>{totalVotes ? Math.round(option.voteCount / totalVotes * 100) : 0}%</b>
                  {showVoters && <span className="poll-voter-tooltip" id={tooltipId} role="tooltip">{option.voterNames?.join(', ')}</span>}</label>
              })}
              <button className="primary-button" onClick={() => void submitVote(poll.id)}>{copy.vote}</button>
              <Discussion kind="poll" resourceId={poll.id} language={language} copy={discussionCopy} canAccess={canAccessDiscussions} canPost={!poll.closes_at || Date.parse(poll.closes_at) > clock} onSignIn={() => setAdminOpen(true)} />
              {poll.canTranslate && <button className="news-translate-button" type="button" disabled={translatingPoll === poll.translationKey} onClick={() => void translatePoll(poll)}><Languages size={15} />{translatingPoll === poll.translationKey ? copy.translatingNews : poll.isTranslated ? copy.viewOriginal : copy.translateNews}</button>}
              {pollTranslationErrors[poll.id] && <small className="news-translation-error" role="alert">{pollTranslationErrors[poll.id]}</small>}
            </article>
          })}</div>
        </section>

        <section className="section events-section" id="events">
          <header className="section-header"><div><p className="eyebrow">{copy.eventsLabel}</p><h2>{copy.eventsTitle}</h2><p>{copy.eventsIntro}</p></div><CalendarRange size={48} /></header>
          <div className="event-tabs" role="tablist">
            {copy.eventItems.map((eventItem, index) => <button type="button" role="tab" aria-selected={selectedEvent === index} className={selectedEvent === index ? 'active' : ''} onClick={() => setSelectedEvent(index)} key={eventItem.image}><span>{String(index + 1).padStart(2, '0')}</span>{eventItem.title}</button>)}
          </div>
          <article className="event-guide">
            <div className="event-guide-media"><img src={asset(`events/${copy.eventItems[selectedEvent].image}`)} alt={copy.eventItems[selectedEvent].title} /></div>
            <div className="event-guide-copy"><p className="eyebrow">{String(selectedEvent + 1).padStart(2, '0')}</p><h3>{copy.eventItems[selectedEvent].title}</h3><p>{copy.eventItems[selectedEvent].summary}</p><dl><div><dt>{copy.eventObjective}</dt><dd>{copy.eventItems[selectedEvent].objective}</dd></div><div><dt>{copy.eventStrategy}</dt><dd>{copy.eventItems[selectedEvent].strategy}</dd></div></dl></div>
          </article>
        </section>

        <section className="section roster-section" id="roster">
          <header className="section-header"><div><p className="eyebrow">{copy.rosterLabel}</p><h2>{copy.rosterTitle}</h2><p>{copy.rosterText}</p></div>
            <div className="section-stat"><strong>{members.length}</strong><span>{copy.members}<br />{copy.updated}</span></div></header>
          <div className="rank-filters" role="tablist"><button className={rankFilter === 'ALL' ? 'active' : ''} onClick={() => setRankFilter('ALL')}>ALL</button>
            {rankOrder.map((rank) => <button className={rankFilter === rank ? 'active' : ''} onClick={() => setRankFilter(rank)} key={rank}>{rank}</button>)}</div>
          <div className="data-toolbar"><div className="metric-tabs">{(['combat_power', 'kills', 'weekly_contribution'] as Metric[]).map((item) =>
            <button className={metric === item ? 'active' : ''} onClick={() => setMetric(item)} key={item}>{copy[item === 'combat_power' ? 'combatPower' : item === 'weekly_contribution' ? 'weeklyContribution' : 'kills']}</button>)}</div>
            <label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label></div>
          <div className="ranking-table"><div className="table-head"><span>#</span><span>{copy.member}</span><span>{copy.role}</span><span>{copy[metric === 'combat_power' ? 'combatPower' : metric === 'weekly_contribution' ? 'weeklyContribution' : 'kills']}</span><span className="performance-column">{copy.viewEvolution}</span></div>
            {roster.map((item, index) => <button className="member-row" type="button" onClick={() => setPerformanceMember(item)} aria-label={`${copy.performanceHistory}: ${item.member_name}`} key={item.id}><span className="position">{String(index + 1).padStart(2, '0')}</span>
              <span className="member-name"><i>{item.player_level}</i><b>{item.member_name}</b></span><span><em className={`rank rank-${item.rank.toLowerCase()}`}>{item.rank}</em></span>
              <strong>{item[metric].toLocaleString(language)}</strong><span className="performance-link"><TrendingUp size={17} /><b>{copy.viewEvolution}</b></span></button>)}</div>
        </section>

        <section className="section application-section" id="application">
          <div className="application-copy"><p className="eyebrow">{copy.applyLabel}</p><h2>{copy.applyTitle}</h2><p>{copy.applyText}</p><div className="spartan-number">R4</div></div>
          <form className="application-form" onSubmit={submitApplication}>
            <div className="signed-member"><span>{copy.selectMember}</span><strong>{portal.profile?.member_name ?? copy.loginRequired}</strong></div>
            <label>{copy.reason}<textarea name="reason" required minLength={10} placeholder={copy.reasonHint} rows={4} /></label><label>{copy.experience}<textarea name="experience" required minLength={10} placeholder={copy.experienceHint} rows={3} /></label>
            <label>{copy.availability}<input name="availability" required placeholder="18:00–23:00 UTC" /></label>
            <label className="code-agreement"><input type="checkbox" name="codeAgreement" required /><span>{copy.codeAgreement} <a href="#code" onClick={() => setCodeAudience('r4')}>{copy.codeAdmins}</a>.</span></label>
            <button className="primary-button" type="submit">{copy.submit}<ChevronRight size={18} /></button>
          </form>
        </section>

        <section className="section code-section" id="code">
          <header className="section-header"><div><p className="eyebrow">{copy.codeLabel}</p><h2>{copy.codeTitle}: {codeAudience === 'players' ? copy.codePlayers : copy.codeAdmins}</h2><p>{copy.rulesText}</p></div><Shield size={48} /></header>
          <div className="code-rank-tabs" role="tablist" aria-label={copy.codeTitle}>{codeAudiences.map((audience) => <button type="button" role="tab" aria-selected={codeAudience === audience} className={codeAudience === audience ? 'active' : ''} onClick={() => setCodeAudience(audience)} key={audience}>{audience === 'players' ? copy.codePlayers : copy.codeAdmins}</button>)}</div>
          <div className="rules-grid">{[...codeRuleIndexes[codeAudience].map((ruleIndex) => copy.ruleItems[ruleIndex]), ...(codeAudience === 'players' ? [copy.codeCourtesy] : [])].map((rule, index) => <article key={rule}><span>{String(index + 1).padStart(2, '0')}</span><p>{rule}</p></article>)}</div>
        </section>
      </main>

      <footer><div className="brand"><span className="brand-mark"><Shield size={20} /></span><span><b>FFF</b><strong>SPARTAN</strong></span></div><p>{copy.footer}<br /><small>{copy.fanNotice}</small></p><img src={asset('dark-war-logo.png')} alt="Dark War: Survival" /></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
      <Suspense fallback={null}><MemberPerformanceModal member={performanceMember} copy={copy} language={language} canView={Boolean(portal.user && portal.profile?.active && portal.profile.registration_status === 'approved')} onClose={() => setPerformanceMember(null)} onSignIn={() => { setPerformanceMember(null); setAdminOpen(true) }} /></Suspense>
      <AdminPortal open={adminOpen || portal.passwordRecovery} copy={copy} language={language} user={portal.user} profile={portal.profile} availableMembers={portal.availableMembers} members={portal.members} onClose={() => { setAdminOpen(false); if (portal.passwordRecovery) void portal.signOut() }} onSignIn={portal.signIn} onSignUp={portal.signUp} onRequestPasswordReset={portal.requestPasswordReset} onUpdatePassword={async (password) => { const result = await portal.updatePassword(password); if (result.ok) setAdminOpen(true); return result }} onUpdateEmailPreferences={portal.updateEmailPreferences} passwordRecovery={portal.passwordRecovery} onSignOut={portal.signOut} onRefreshPolls={portal.refreshPolls} onRefreshBoardNews={portal.refreshBoardNews} onRefreshMembers={portal.refreshMembers} onRefreshAvailableMembers={portal.refreshAvailableMembers} />
    </div>
  )
}

export default App
