import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL')

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return new Response(JSON.stringify({ error: 'Missing email secrets' }), { status: 500 })
    }

    const { full_name, email, community_path } = await req.json()

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>Welcome to the CrownMind Community</h2>
        <p>Hello ${full_name || 'friend'},</p>
        <p>Your request has been approved.</p>
        <p><strong>Assigned Path:</strong> ${community_path || 'Member'}</p>
        <p>You may now enter the Circle and continue your journey.</p>
        <p>Blessings,<br/>CrownMind Institute</p>
      </div>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: 'Welcome to the CrownMind Community',
        html
      })
    })

    const result = await resendResponse.text()

    return new Response(result, {
      status: resendResponse.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
