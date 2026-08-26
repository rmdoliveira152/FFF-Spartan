import { createClient } from 'npm:@supabase/supabase-js@2.112.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const languageCodes: Record<string, string> = {
  pt: 'pt-pt',
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pl: 'pl',
  ru: 'ru',
  tr: 'tr',
  id: 'id',
  vi: 'vi',
  th: 'th',
  ja: 'ja',
  ko: 'ko',
  ar: 'ar',
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  try {
    const { newsId, targetLanguage } = await request.json()
    if (typeof newsId !== 'string' || !/^[0-9a-f-]{36}$/i.test(newsId)) return response({ error: 'Invalid announcement.' }, 400)
    if (typeof targetLanguage !== 'string' || !languageCodes[targetLanguage]) return response({ error: 'Unsupported target language.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const translatorKey = Deno.env.get('AZURE_TRANSLATOR_KEY')
    const translatorRegion = Deno.env.get('AZURE_TRANSLATOR_REGION')
    if (!supabaseUrl || !serviceRoleKey || !translatorKey || !translatorRegion) return response({ error: 'Translation service is not configured.' }, 503)

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: news, error: newsError } = await supabase
      .from('board_news')
      .select('id, translations, default_language, updated_at')
      .eq('id', newsId)
      .eq('published', true)
      .lte('published_at', new Date().toISOString())
      .maybeSingle()

    if (newsError) throw newsError
    if (!news) return response({ error: 'Announcement not found.' }, 404)

    const original = news.translations[news.default_language] ?? Object.values(news.translations)[0]
    if (!original?.title || !original?.body) return response({ error: 'Announcement has no original text.' }, 422)

    if (news.default_language === targetLanguage) {
      return response({ translation: original, sourceLanguage: news.default_language, cached: true })
    }

    const storedTranslation = news.translations[targetLanguage]
    if (storedTranslation?.title && storedTranslation?.body) {
      return response({ translation: storedTranslation, sourceLanguage: news.default_language, cached: true })
    }

    const { data: cached } = await supabase
      .from('board_news_translation_cache')
      .select('title, body, detected_source_language, source_updated_at')
      .eq('news_id', newsId)
      .eq('target_language', targetLanguage)
      .maybeSingle()

    if (cached?.source_updated_at === news.updated_at) {
      return response({
        translation: { title: cached.title, body: cached.body },
        sourceLanguage: cached.detected_source_language ?? news.default_language,
        cached: true,
      })
    }

    const query = new URLSearchParams({ 'api-version': '3.0', to: languageCodes[targetLanguage] })
    if (news.default_language !== 'und' && languageCodes[news.default_language]) query.set('from', languageCodes[news.default_language])

    const azureResponse = await fetch(`https://api.cognitive.microsofttranslator.com/translate?${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': translatorKey,
        'Ocp-Apim-Subscription-Region': translatorRegion,
      },
      body: JSON.stringify([{ Text: original.title }, { Text: original.body }]),
    })

    if (!azureResponse.ok) {
      console.error('Azure Translator error', azureResponse.status, await azureResponse.text())
      return response({ error: 'Translation service is temporarily unavailable.' }, 502)
    }

    const translated = await azureResponse.json()
    const detectedSource = toPortalLanguage(translated[0]?.detectedLanguage?.language ?? news.default_language)
    const translation = detectedSource === targetLanguage
      ? original
      : {
          title: translated[0]?.translations?.[0]?.text,
          body: translated[1]?.translations?.[0]?.text,
        }

    if (!translation.title || !translation.body) return response({ error: 'Translation service returned an invalid response.' }, 502)

    const { data: latestNews, error: latestNewsError } = await supabase
      .from('board_news')
      .select('updated_at')
      .eq('id', newsId)
      .single()
    if (latestNewsError) throw latestNewsError
    if (latestNews.updated_at !== news.updated_at) {
      return response({ error: 'The announcement changed during translation. Please try again.' }, 409)
    }

    const { error: cacheError } = await supabase.from('board_news_translation_cache').upsert({
      news_id: newsId,
      target_language: targetLanguage,
      detected_source_language: detectedSource,
      title: translation.title,
      body: translation.body,
      source_updated_at: news.updated_at,
      created_at: new Date().toISOString(),
    })
    if (cacheError) console.error('Translation cache error', cacheError)

    return response({ translation, sourceLanguage: detectedSource, cached: false })
  } catch (error) {
    console.error(error)
    return response({ error: 'Unable to translate this announcement.' }, 500)
  }
})
