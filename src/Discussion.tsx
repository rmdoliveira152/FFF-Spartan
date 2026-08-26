import { useEffect, useEffectEvent, useState, type FormEvent } from 'react'
import { Languages, MessageCircle, Send, Trash2 } from 'lucide-react'
import type { Language } from './i18n'
import type { DiscussionCopy } from './discussionCopy'
import { supabase, type DiscussionComment, type DiscussionKind } from './supabase'

type DiscussionProps = {
  kind: DiscussionKind
  resourceId: string
  language: Language
  copy: DiscussionCopy
  canAccess: boolean
  canPost: boolean
  onSignIn: () => void
}

export function Discussion({ kind, resourceId, language, copy, canAccess, canPost, onSignIn }: DiscussionProps) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<DiscussionComment[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [translated, setTranslated] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState<string | null>(null)

  const loadComments = async () => {
    if (!supabase || !canAccess) return
    setLoading(true)
    const { data, error: loadError } = await supabase.rpc('discussion_comments', {
      resource_kind: kind,
      resource_id: resourceId,
    })
    setLoading(false)
    if (loadError) {
      setError(copy.loadFailed)
      return
    }
    setError('')
    setComments((data ?? []) as DiscussionComment[])
  }

  const refreshComments = useEffectEvent(loadComments)

  useEffect(() => {
    if (!expanded || !canAccess || !supabase) return
    const table = kind === 'board_news' ? 'board_news_comments' : 'poll_comments'
    const parentField = kind === 'board_news' ? 'news_id' : 'poll_id'
    const channel = supabase
      .channel(`discussion:${kind}:${resourceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `${parentField}=eq.${resourceId}` }, () => void refreshComments())
      .subscribe()
    return () => { void supabase?.removeChannel(channel) }
  }, [canAccess, expanded, kind, resourceId])

  const toggle = () => {
    if (!canAccess) {
      onSignIn()
      return
    }
    if (!expanded) void loadComments()
    setExpanded((current) => !current)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const content = message.trim()
    if (!supabase || !content || sending) return
    setSending(true)
    const { error: sendError } = await supabase.rpc('post_discussion_comment', {
      resource_kind: kind,
      resource_id: resourceId,
      message: content,
    })
    setSending(false)
    if (sendError) {
      setError(sendError.message || copy.sendFailed)
      return
    }
    setMessage('')
    setError('')
    await loadComments()
  }

  const remove = async (commentId: string) => {
    if (!supabase || !window.confirm(copy.confirmDelete)) return
    const { error: deleteError } = await supabase.rpc('delete_discussion_comment', {
      resource_kind: kind,
      comment_id: commentId,
    })
    if (deleteError) setError(deleteError.message)
    else await loadComments()
  }

  const translate = async (comment: DiscussionComment) => {
    if (translated[comment.comment_id]) {
      setTranslated((current) => {
        const next = { ...current }
        delete next[comment.comment_id]
        return next
      })
      return
    }
    if (!supabase) return
    setTranslating(comment.comment_id)
    const { data, error: translationError } = await supabase.functions.invoke('translate-comment', {
      body: { kind, commentId: comment.comment_id, targetLanguage: language },
    })
    setTranslating(null)
    if (translationError || !data?.translation) {
      setError(data?.error ?? copy.translationFailed)
      return
    }
    if (data.sourceLanguage !== language) {
      setTranslated((current) => ({ ...current, [comment.comment_id]: data.translation }))
    }
  }

  return <div className="discussion">
    <button className="discussion-toggle" type="button" aria-expanded={expanded} onClick={toggle}>
      <MessageCircle size={16} />{copy.discussion}{expanded && <span>{comments.length}</span>}
    </button>
    {!canAccess && <small>{copy.signIn}</small>}
    {expanded && canAccess && <div className="discussion-panel">
      {loading && comments.length === 0 && <p className="discussion-status">...</p>}
      {!loading && comments.length === 0 && <p className="discussion-status">{copy.noComments}</p>}
      {comments.length > 0 && <ol className="discussion-list">{comments.map((comment) => <li key={comment.comment_id}>
        <div className="discussion-message-meta"><strong>{comment.member_name}</strong><time>{new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(comment.created_at))}</time></div>
        <p>{translated[comment.comment_id] ?? comment.message}</p>
        <div className="discussion-message-actions">
          <button type="button" disabled={translating === comment.comment_id} onClick={() => void translate(comment)}><Languages size={13} />{translating === comment.comment_id ? copy.translating : translated[comment.comment_id] ? copy.viewOriginal : copy.translate}</button>
          {comment.can_delete && <button type="button" aria-label={copy.deleteComment} onClick={() => void remove(comment.comment_id)}><Trash2 size={13} />{copy.deleteComment}</button>}
        </div>
      </li>)}</ol>}
      {canPost ? <form className="discussion-form" onSubmit={submit}>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} placeholder={copy.placeholder} required />
        <div><small>{message.length}/500</small><button className="primary-button" type="submit" disabled={sending || !message.trim()}><Send size={15} />{copy.send}</button></div>
      </form> : <p className="discussion-status">{copy.closed}</p>}
      {error && <p className="discussion-error" role="alert">{error}</p>}
    </div>}
  </div>
}