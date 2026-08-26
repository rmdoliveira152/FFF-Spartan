import { createClient } from 'npm:@supabase/supabase-js@2.112.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

type NotificationKind = 'poll' | 'board_news'
type Recipient = { id: string; member_name: string; email: string }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!authorization) return response({ error: 'Authentication required.' }, 401)
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) return response({ error: 'Notification service is not configured.' }, 503)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return response({ error: 'Authentication required.' }, 401)

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (profile?.role !== 'admin' || !profile.active) return response({ error: 'Administrator access required.' }, 403)

    const { kind, resourceId } = await request.json() as { kind?: NotificationKind; resourceId?: string }
    if (!resourceId || (kind !== 'poll' && kind !== 'board_news')) return response({ error: 'Invalid notification request.' }, 400)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    let subject: string
    let heading: string
    let message: string
    let targetUrl: string
    let preferenceColumn: 'notify_poll_emails' | 'notify_news_emails'

    if (kind === 'poll') {
      const { data: poll, error } = await serviceClient.from('polls').select('question, active').eq('id', resourceId).maybeSingle()
      if (error) throw error
      if (!poll?.active) return response({ error: 'Only active polls can be announced.' }, 400)
      subject = 'New FFF-Spartan poll'
      heading = 'A new alliance poll is open'
      message = poll.question
      targetUrl = 'https://www.fff-spartan.fr/#polls'
      preferenceColumn = 'notify_poll_emails'
    } else {
      const { data: news, error } = await serviceClient
        .from('board_news')
        .select('translations, default_language, published, archived_at')
        .eq('id', resourceId)
        .maybeSingle()
      if (error) throw error
      if (!news?.published || news.archived_at) return response({ error: 'Only published announcements can be emailed.' }, 400)
      const translation = news.translations?.[news.default_language] ?? Object.values(news.translations ?? {})[0]
      if (!translation || typeof translation !== 'object' || !('title' in translation)) return response({ error: 'Announcement content is unavailable.' }, 400)
      subject = `FFF-Spartan Board News: ${String(translation.title)}`
      heading = String(translation.title)
      message = String('body' in translation ? translation.body : '')
      targetUrl = 'https://www.fff-spartan.fr/#news'
      preferenceColumn = 'notify_news_emails'
    }

    const { data: profiles, error: recipientsError } = await serviceClient
      .from('profiles')
      .select(`id, member_name, ${preferenceColumn}`)
      .eq('active', true)
      .eq('registration_status', 'approved')
      .eq(preferenceColumn, true)
    if (recipientsError) throw recipientsError

    const users = []
    for (let page = 1; ; page += 1) {
      const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw error
      users.push(...data.users)
      if (data.users.length < 1000) break
    }
    const emails = new Map(users.filter((item) => item.email).map((item) => [item.id, item.email as string]))
    const recipients: Recipient[] = (profiles ?? []).flatMap((item) => {
      const email = emails.get(item.id)
      return email ? [{ id: item.id, member_name: item.member_name, email }] : []
    })
    if (!recipients.length) return response({ ok: true, sent: 0, skipped: 0 })

    const { data: existing, error: existingError } = await serviceClient
      .from('notification_deliveries')
      .select('recipient_user_id, status')
      .eq('kind', kind)
      .eq('resource_id', resourceId)
    if (existingError) throw existingError
    const notified = new Set((existing ?? []).filter((item) => item.status !== 'failed').map((item) => item.recipient_user_id))
    const pendingRecipients = recipients.filter((item) => !notified.has(item.id))
    if (!pendingRecipients.length) return response({ ok: true, sent: 0, skipped: recipients.length })

    const { error: deliveryInsertError } = await serviceClient.from('notification_deliveries').upsert(
      pendingRecipients.map((item) => ({ kind, resource_id: resourceId, recipient_user_id: item.id, status: 'pending', error: null })),
      { onConflict: 'kind,resource_id,recipient_user_id' },
    )
    if (deliveryInsertError) throw deliveryInsertError

    let sent = 0
    for (let offset = 0; offset < pendingRecipients.length; offset += 100) {
      const batch = pendingRecipients.slice(offset, offset + 100)
      const emailResponse = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `member-notification-${kind}-${resourceId}-${offset / 100}`,
        },
        body: JSON.stringify(batch.map((recipient) => ({
          from: 'FFF-Spartan Support <support@fff-spartan.fr>',
          to: [recipient.email],
          subject,
          html: `<div style="font-family:Arial,sans-serif;color:#18201d;line-height:1.6"><h1 style="color:#ed3833">${escapeHtml(heading)}</h1><p>Hello ${escapeHtml(recipient.member_name)},</p><p>${escapeHtml(message)}</p><p><a href="${targetUrl}" style="color:#b42318;font-weight:700">Open FFF-Spartan</a></p><p>You receive operational emails because your alliance account is active. You can change this preference in your account.</p></div>`,
        }))),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Resend batch error', emailResponse.status, errorText)
        await Promise.all(batch.map((recipient) => serviceClient.from('notification_deliveries').update({ status: 'failed', error: `Resend ${emailResponse.status}` }).eq('kind', kind).eq('resource_id', resourceId).eq('recipient_user_id', recipient.id)))
        continue
      }

      const emailResult = await emailResponse.json() as { data?: Array<{ id: string }> }
      const sentAt = new Date().toISOString()
      await Promise.all(batch.map((recipient, index) => serviceClient
        .from('notification_deliveries')
        .update({ status: 'sent', email_id: emailResult.data?.[index]?.id ?? null, sent_at: sentAt })
        .eq('kind', kind)
        .eq('resource_id', resourceId)
        .eq('recipient_user_id', recipient.id)))
      sent += batch.length
    }

    if (sent < pendingRecipients.length) return response({ error: 'The content was saved, but some member notifications could not be sent.', sent }, 502)

    return response({ ok: true, sent, skipped: recipients.length - pendingRecipients.length })
  } catch (error) {
    console.error(error)
    return response({ error: 'Unable to notify alliance members.' }, 500)
  }
})