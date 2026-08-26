import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { ImagePlus, Languages, MessageCircle, Send, Trash2, X } from 'lucide-react'
import type { Language } from './i18n'
import type { DiscussionCopy } from './discussionCopy'
import { compressDiscussionImage, MAX_COMMENT_IMAGES } from './discussionImages'
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

type SelectedImage = {
  id: string
  file: File
  previewUrl: string
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
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [processingImages, setProcessingImages] = useState(false)
  const previewUrls = useRef(new Set<string>())

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

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
    const loadedComments = (data ?? []) as DiscussionComment[]
    setComments(loadedComments)
    const paths = [...new Set(loadedComments.flatMap((comment) => comment.image_paths ?? []))]
    if (paths.length === 0) {
      setImageUrls({})
      return
    }
    const { data: signedImages } = await supabase.storage.from('discussion-images').createSignedUrls(paths, 60 * 60)
    setImageUrls(Object.fromEntries((signedImages ?? []).filter((image) => image.signedUrl).map((image) => [image.path, image.signedUrl])))
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

  const addImages = async (files: File[]) => {
    if (files.length === 0 || processingImages) return
    if (selectedImages.length + files.length > MAX_COMMENT_IMAGES) {
      setError(copy.imageLimit)
      return
    }
    setProcessingImages(true)
    setError('')
    const nextImages: SelectedImage[] = []
    try {
      for (const source of files) {
        const file = await compressDiscussionImage(source)
        const previewUrl = URL.createObjectURL(file)
        previewUrls.current.add(previewUrl)
        nextImages.push({ id: crypto.randomUUID(), file, previewUrl })
      }
      setSelectedImages((current) => [...current, ...nextImages])
    } catch (imageError) {
      nextImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl)
        previewUrls.current.delete(image.previewUrl)
      })
      setError(imageError instanceof Error && imageError.message === 'INVALID_IMAGE' ? copy.imageInvalid : copy.imageLimit)
    } finally {
      setProcessingImages(false)
    }
  }

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    void addImages(Array.from(event.currentTarget.files ?? []))
    event.currentTarget.value = ''
  }

  const pasteImages = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file))
    if (files.length === 0) return
    event.preventDefault()
    void addImages(files)
  }

  const dropImages = (event: DragEvent<HTMLFormElement>) => {
    event.preventDefault()
    void addImages(Array.from(event.dataTransfer.files))
  }

  const removeSelectedImage = (image: SelectedImage) => {
    URL.revokeObjectURL(image.previewUrl)
    previewUrls.current.delete(image.previewUrl)
    setSelectedImages((current) => current.filter((item) => item.id !== image.id))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const content = message.trim()
    if (!supabase || (!content && selectedImages.length === 0) || sending || processingImages) return
    setSending(true)
    const uploadedPaths: string[] = []
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(copy.sendFailed)
      for (const image of selectedImages) {
        const path = `${user.id}/${kind}/${resourceId}/${image.file.name}`
        const { error: uploadError } = await supabase.storage.from('discussion-images').upload(path, image.file, {
          contentType: 'image/webp',
          upsert: false,
        })
        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }
      const { error: sendError } = await supabase.rpc('post_discussion_comment', {
        resource_kind: kind,
        resource_id: resourceId,
        message: content,
        requested_image_paths: uploadedPaths,
      })
      if (sendError) throw sendError
    } catch (sendError) {
      if (uploadedPaths.length > 0) await supabase.storage.from('discussion-images').remove(uploadedPaths)
      setSending(false)
      setError(sendError instanceof Error ? sendError.message : copy.sendFailed)
      return
    }
    setMessage('')
    selectedImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl)
      previewUrls.current.delete(image.previewUrl)
    })
    setSelectedImages([])
    setError('')
    setSending(false)
    await loadComments()
  }

  const remove = async (comment: DiscussionComment) => {
    if (!supabase || !window.confirm(copy.confirmDelete)) return
    const { error: deleteError } = await supabase.rpc('delete_discussion_comment', {
      resource_kind: kind,
      comment_id: comment.comment_id,
    })
    if (deleteError) setError(deleteError.message)
    else {
      if (comment.image_paths.length > 0) await supabase.storage.from('discussion-images').remove(comment.image_paths)
      await loadComments()
    }
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
        {comment.message && <p>{translated[comment.comment_id] ?? comment.message}</p>}
        {comment.image_paths.length > 0 && <div className={`discussion-images count-${comment.image_paths.length}`}>
          {comment.image_paths.map((path, index) => imageUrls[path] && <a href={imageUrls[path]} target="_blank" rel="noreferrer" aria-label={`${copy.openImage} ${index + 1}`} key={path}><img src={imageUrls[path]} alt="" loading="lazy" /></a>)}
        </div>}
        <div className="discussion-message-actions">
          {comment.message && <button type="button" disabled={translating === comment.comment_id} onClick={() => void translate(comment)}><Languages size={13} />{translating === comment.comment_id ? copy.translating : translated[comment.comment_id] ? copy.viewOriginal : copy.translate}</button>}
          {comment.can_delete && <button type="button" aria-label={copy.deleteComment} onClick={() => void remove(comment)}><Trash2 size={13} />{copy.deleteComment}</button>}
        </div>
      </li>)}</ol>}
      {canPost ? <form className="discussion-form" onSubmit={submit} onDragOver={(event) => event.preventDefault()} onDrop={dropImages}>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} onPaste={pasteImages} maxLength={500} rows={3} placeholder={copy.placeholder} />
        {selectedImages.length > 0 && <div className="discussion-image-previews">{selectedImages.map((image) => <figure key={image.id}>
          <img src={image.previewUrl} alt="" /><figcaption>{Math.ceil(image.file.size / 1024)} KB</figcaption>
          <button type="button" title={copy.removeImage} aria-label={copy.removeImage} onClick={() => removeSelectedImage(image)}><X size={14} /></button>
        </figure>)}</div>}
        <div className="discussion-form-actions"><span className="discussion-form-tools"><label className="discussion-image-picker" title={copy.addImages}><ImagePlus size={16} /><span className="sr-only">{copy.addImages}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={processingImages || selectedImages.length >= MAX_COMMENT_IMAGES} onChange={selectImages} /></label><small>{processingImages ? copy.imageProcessing : `${selectedImages.length}/${MAX_COMMENT_IMAGES}`}</small></span><small>{message.length}/500</small><button className="primary-button" type="submit" disabled={sending || processingImages || (!message.trim() && selectedImages.length === 0)}><Send size={15} />{copy.send}</button></div>
      </form> : <p className="discussion-status">{copy.closed}</p>}
      {error && <p className="discussion-error" role="alert">{error}</p>}
    </div>}
  </div>
}