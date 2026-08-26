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
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) {
      return response({ error: 'Notification service is not configured.' }, 503)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return response({ error: 'Authentication required.' }, 401)

    const { data: administrator, error: administratorError } = await userClient
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .maybeSingle()
    if (administratorError) throw administratorError
    if (administrator?.role !== 'admin' || !administrator.active) {
      return response({ error: 'Administrator access required.' }, 403)
    }

    const { profileId } = await request.json() as { profileId?: string }
    if (!profileId) return response({ error: 'Profile is required.' }, 400)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, member_name, active, registration_status')
      .eq('id', profileId)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile?.active || profile.registration_status !== 'approved') {
      return response({ error: 'An approved active member is required.' }, 400)
    }

    const { data: existing, error: existingError } = await serviceClient
      .from('notification_deliveries')
      .select('status')
      .eq('kind', 'registration_approved')
      .eq('resource_id', profile.id)
      .eq('recipient_user_id', profile.id)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing?.status === 'sent') {
      return response({ ok: true, sent: 0, skipped: 1 })
    }

    const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(profile.id)
    if (authUserError) throw authUserError
    if (!authUser.user.email) return response({ error: 'Member email is unavailable.' }, 422)

    const { error: deliveryError } = await serviceClient.from('notification_deliveries').upsert({
      kind: 'registration_approved',
      resource_id: profile.id,
      recipient_user_id: profile.id,
      status: 'pending',
      email_id: null,
      error: null,
      sent_at: null,
    }, { onConflict: 'kind,resource_id,recipient_user_id' })
    if (deliveryError) throw deliveryError

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `registration-approved-${profile.id}`,
      },
      body: JSON.stringify({
        from: 'FFF-Spartan Support <support@fff-spartan.fr>',
        to: [authUser.user.email],
        subject: 'Your FFF-Spartan registration was approved',
        html: `<div style="font-family:Arial,sans-serif;color:#18201d;line-height:1.6"><h1 style="color:#ed3833">Registration approved</h1><p>Hello ${escapeHtml(profile.member_name)},</p><p>Your FFF-Spartan member registration has been approved. You can now sign in and access the alliance member features.</p><p><a href="https://www.fff-spartan.fr/" style="color:#b42318;font-weight:700">Open FFF-Spartan</a></p></div>`,
      }),
    })

    if (!emailResponse.ok) {
      console.error('Resend error', emailResponse.status, await emailResponse.text())
      await serviceClient.from('notification_deliveries')
        .update({ status: 'failed', error: `Resend ${emailResponse.status}` })
        .eq('kind', 'registration_approved')
        .eq('resource_id', profile.id)
        .eq('recipient_user_id', profile.id)
      return response({ error: 'Registration was approved, but the email could not be sent.' }, 502)
    }

    const emailResult = await emailResponse.json() as { id?: string }
    const { error: sentUpdateError } = await serviceClient.from('notification_deliveries')
      .update({ status: 'sent', email_id: emailResult.id ?? null, sent_at: new Date().toISOString() })
      .eq('kind', 'registration_approved')
      .eq('resource_id', profile.id)
      .eq('recipient_user_id', profile.id)
    if (sentUpdateError) throw sentUpdateError

    return response({ ok: true, sent: 1, skipped: 0 })
  } catch (error) {
    console.error(error)
    return response({ error: 'Unable to send the registration approval email.' }, 500)
  }
})