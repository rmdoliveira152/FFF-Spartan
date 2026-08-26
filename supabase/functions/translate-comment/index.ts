import { createClient } from 'npm:@supabase/supabase-js@2.112.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const languageCodes: Record<string, string> = {
  pt: 'pt-pt', en: 'en', es: 'es', fr: 'fr', de: 'de', it: 'it', pl: 'pl', ru: 'ru', tr: 'tr', id: 'id',
  vi: 'vi', th: 'th', ja: 'ja', ko: 'ko', ar: 'ar', 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant',
}

const toPortalLanguage = (language: string) => {
  const normalized = language.toLowerCase()
  if (normalized === 'pt' || normalized === 'pt-pt' || normalized === 'pt-br') return 'pt'
  if (normalized === 'zh-hans' || normalized === 'zh-cn') return 'zh-CN'
  if (normalized === 'zh-hant' || normalized === 'zh-tw') return 'zh-TW'
  return Object.hasOwn(languageCodes, normalized) ? normalized : 'und'
}

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

type DiscussionKind = 'board_news' | 'poll'
type TranslationEntry = { text: string; sourceLanguage: string }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const translatorKey = Deno.env.get('AZURE_TRANSLATOR_KEY')
    const translatorRegion = Deno.env.get('AZURE_TRANSLATOR_REGION')
    if (!authorization) return response({ error: 'Authentication required.' }, 401)
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !translatorKey || !translatorRegion) {
      return response({ error: 'Translation service is not configured.' }, 503)
    }

    const { kind, commentId, targetLanguage } = await request.json() as {
      kind?: DiscussionKind
      commentId?: string
      targetLanguage?: string
    }
    if (kind !== 'board_news' && kind !== 'poll') return response({ error: 'Invalid discussion type.' }, 400)
    if (!commentId || !/^[0-9a-f-]{36}$/i.test(commentId)) return response({ error: 'Invalid comment.' }, 400)
    if (!targetLanguage || !languageCodes[targetLanguage]) return response({ error: 'Unsupported target language.' }, 400)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return response({ error: 'Authentication required.' }, 401)

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role, active, registration_status')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile?.active || (profile.registration_status !== 'approved' && profile.role !== 'admin')) {
      return response({ error: 'Approved member access required.' }, 403)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const table = kind === 'board_news' ? 'board_news_comments' : 'poll_comments'
    const parentField = kind === 'board_news' ? 'news_id' : 'poll_id'
    const { data: comment, error: commentError } = await serviceClient
      .from(table)
      .select(`id, content, translations, deleted_at, ${parentField}`)
      .eq('id', commentId)
      .maybeSingle()
    if (commentError) throw commentError
    if (!comment || comment.deleted_at) return response({ error: 'Comment not found.' }, 404)

    const parentId = String(comment[parentField])
    if (kind === 'board_news') {
      const { data: news } = await serviceClient.from('board_news').select('id').eq('id', parentId).eq('published', true).lte('published_at', new Date().toISOString()).maybeSingle()
      if (!news) return response({ error: 'Announcement discussion is unavailable.' }, 404)
    } else {
      const { data: poll } = await serviceClient.from('polls').select('id').eq('id', parentId).eq('active', true).maybeSingle()
      if (!poll) return response({ error: 'Poll discussion is unavailable.' }, 404)
    }

    const stored = (comment.translations as Record<string, TranslationEntry> | null)?.[targetLanguage]
    if (stored?.text) return response({ translation: stored.text, sourceLanguage: stored.sourceLanguage, cached: true })

    const query = new URLSearchParams({ 'api-version': '3.0', to: languageCodes[targetLanguage] })
    const azureResponse = await fetch(`https://api.cognitive.microsofttranslator.com/translate?${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': translatorKey,
        'Ocp-Apim-Subscription-Region': translatorRegion,
      },
      body: JSON.stringify([{ Text: comment.content }]),
    })
    if (!azureResponse.ok) {
      console.error('Azure Translator error', azureResponse.status, await azureResponse.text())
      return response({ error: 'Translation service is temporarily unavailable.' }, 502)
    }

    const translated = await azureResponse.json()
    const sourceLanguage = toPortalLanguage(translated[0]?.detectedLanguage?.language ?? 'und')
    const translation = sourceLanguage === targetLanguage ? comment.content : translated[0]?.translations?.[0]?.text
    if (!translation) return response({ error: 'Translation service returned an invalid response.' }, 502)

    const cacheEntry: TranslationEntry = { text: translation, sourceLanguage }
    const { error: cacheError } = await serviceClient.rpc('store_discussion_translation', {
      resource_kind: kind,
      comment_id: commentId,
      target_language: targetLanguage,
      translation: cacheEntry,
    })
    if (cacheError) console.error('Comment translation cache error', cacheError)

    return response({ translation, sourceLanguage, cached: false })
  } catch (error) {
    console.error(error)
    return response({ error: 'Unable to translate this comment.' }, 500)
  }
})