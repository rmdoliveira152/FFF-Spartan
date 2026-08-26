import { createClient } from 'npm:@supabase/supabase-js@2.112.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const isTextBetween = (value: unknown, minimum: number, maximum: number) =>
  typeof value === 'string' && value.trim().length >= minimum && value.trim().length <= maximum

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
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return response({ error: 'Authentication service is not configured.' }, 503)
    if (!resendApiKey) return response({ error: 'Confirmation email service is not configured.' }, 503)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user?.email) return response({ error: 'Authentication required.' }, 401)

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('member_name, active, registration_status')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile?.active || profile.registration_status !== 'approved') return response({ error: 'Approved member access required.' }, 403)

    const { reason, experience, availability, codeAgreed } = await request.json()
    if (!isTextBetween(reason, 10, 2000) || !isTextBetween(experience, 10, 2000) || !isTextBetween(availability, 2, 120)) {
      return response({ error: 'Invalid application details.' }, 400)
    }
    if (codeAgreed !== true) return response({ error: 'R4 operational code agreement is required.' }, 400)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: application, error: insertError } = await serviceClient
      .from('r4_applications')
      .insert({
        user_id: user.id,
        reason: reason.trim(),
        experience: experience.trim(),
        availability: availability.trim(),
        code_agreed_at: new Date().toISOString(),
        code_version: '2026-08-26',
        confirmation_email_status: 'pending',
      })
      .select('id, created_at')
      .single()
    if (insertError) throw insertError

    const memberName = escapeHtml(profile.member_name)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `r4-application-${application.id}`,
      },
      body: JSON.stringify({
        from: 'FFF-Spartan Support <support@fff-spartan.fr>',
        to: [user.email],
        subject: 'Your R4 application has been received',
        html: `<div style="font-family:Arial,sans-serif;color:#18201d;line-height:1.6"><h1 style="color:#ed3833">R4 application received</h1><p>Hello ${memberName},</p><p>Your application for the R4 administrative role at FFF-Spartan has been received successfully.</p><p>You confirmed that you have read and agree to the R4 Operational Code. The alliance administration will review your application.</p><p><strong>Submitted:</strong> ${new Date(application.created_at).toUTCString()}</p><p>FFF-Spartan Administration</p></div>`,
      }),
    })

    if (!resendResponse.ok) {
      console.error('Resend error', resendResponse.status, await resendResponse.text())
      await serviceClient.from('r4_applications').update({ confirmation_email_status: 'failed' }).eq('id', application.id)
      return response({ error: 'The application was saved, but the confirmation email could not be sent.', applicationSaved: true }, 502)
    }

    const emailResult = await resendResponse.json()
    await serviceClient.from('r4_applications').update({
      confirmation_email_status: 'sent',
      confirmation_email_id: emailResult.id,
      confirmation_email_sent_at: new Date().toISOString(),
    }).eq('id', application.id)

    return response({ ok: true })
  } catch (error) {
    console.error(error)
    return response({ error: 'Unable to submit the R4 application.' }, 500)
  }
})