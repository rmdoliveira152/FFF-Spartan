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

const hashSource = async (value: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  try {
    const { pollId, targetLanguage } = await request.json()
    if (typeof pollId !== 'string' || !/^[0-9a-f-]{36}$/i.test(pollId)) return response({ error: 'Invalid poll.' }, 400)
    if (typeof targetLanguage !== 'string' || !languageCodes[targetLanguage]) return response({ error: 'Unsupported target language.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const translatorKey = Deno.env.get('AZURE_TRANSLATOR_KEY')
    const translatorRegion = Deno.env.get('AZURE_TRANSLATOR_REGION')
    if (!supabaseUrl || !serviceRoleKey || !translatorKey || !translatorRegion) return response({ error: 'Translation service is not configured.' }, 503)

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, question, poll_options(id, label, position)')
      .eq('id', pollId)
      .eq('active', true)
      .maybeSingle()
    if (pollError) throw pollError
    if (!poll) return response({ error: 'Poll not found.' }, 404)

    const options = [...poll.poll_options].sort((first, second) => first.position - second.position)
    if (!poll.question || options.length < 2) return response({ error: 'Poll has no translatable content.' }, 422)

    const sourceHash = await hashSource(JSON.stringify({ question: poll.question, options: options.map((option) => [option.id, option.label]) }))
    const { data: cached } = await supabase
      .from('poll_translation_cache')
      .select('question, options, detected_source_language, source_hash')
      .eq('poll_id', pollId)
      .eq('target_language', targetLanguage)
      .maybeSingle()
    if (cached?.source_hash === sourceHash) {
      return response({
        translation: { question: cached.question, options: cached.options },
        sourceLanguage: cached.detected_source_language,
        cached: true,
      })
    }

    const query = new URLSearchParams({ 'api-version': '3.0', to: languageCodes[targetLanguage] })
    const azureResponse = await fetch(`https://api.cognitive.microsofttranslator.com/translate?${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': translatorKey,
        'Ocp-Apim-Subscription-Region': translatorRegion,
      },
      body: JSON.stringify([{ Text: poll.question }, ...options.map((option) => ({ Text: option.label }))]),
    })
    if (!azureResponse.ok) {
      console.error('Azure Translator error', azureResponse.status, await azureResponse.text())
      return response({ error: 'Translation service is temporarily unavailable.' }, 502)
    }

    const translated = await azureResponse.json()
    const detectedSource = toPortalLanguage(translated[0]?.detectedLanguage?.language ?? 'und')
    const translatedOptions = Object.fromEntries(options.map((option, index) => [
      option.id,
      detectedSource === targetLanguage ? option.label : translated[index + 1]?.translations?.[0]?.text,
    ]))
    const translation = {
      question: detectedSource === targetLanguage ? poll.question : translated[0]?.translations?.[0]?.text,
      options: translatedOptions,
    }
    if (!translation.question || Object.values(translation.options).some((label) => !label)) {
      return response({ error: 'Translation service returned an invalid response.' }, 502)
    }

    const { error: cacheError } = await supabase.from('poll_translation_cache').upsert({
      poll_id: pollId,
      target_language: targetLanguage,
      detected_source_language: detectedSource,
      question: translation.question,
      options: translation.options,
      source_hash: sourceHash,
      created_at: new Date().toISOString(),
    })
    if (cacheError) console.error('Translation cache error', cacheError)

    return response({ translation, sourceLanguage: detectedSource, cached: false })
  } catch (error) {
    console.error(error)
    return response({ error: 'Unable to translate this poll.' }, 500)
  }
})
