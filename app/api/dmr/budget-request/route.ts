import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { getPreviewClient } from '@/lib/client'

/**
 * Emails the DMR team when a client presses "Adjust ad spend" in the Studio dashboard.
 *
 * The Studio first creates a `dmrBudgetRequest` document (only signed-in Studio users can),
 * then POSTs its id here. We only send when that document exists, is recent and hasn't been
 * emailed yet, and we build the email from the stored document rather than the request body,
 * so this endpoint can't be used to send arbitrary mail.
 */

const DMR_TEAM_EMAIL = process.env.DMR_TEAM_EMAIL || 'team@dmrmedia.org'
const MAX_AGE_MS = 15 * 60 * 1000

// Studio origins allowed to call this route (hosted Studio + local dev).
const ALLOWED_ORIGINS = [
  'https://alexa-devaney.sanity.studio',
  'https://www.sanity.io',
  'http://localhost:3333',
  ...(process.env.DMR_STUDIO_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
]

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')) })
}

type BudgetRequestDoc = {
  _id: string
  _createdAt: string
  clientName?: string
  currentSpend?: number
  requestedSpend?: number
  baselineMonth?: string
  projection?: { leads?: number; cpl?: number; roi?: number; commission?: number }
  note?: string
  requestedBy?: string
  requestedByEmail?: string
  emailedAt?: string
}

export async function POST(request: Request) {
  const headers = cors(request.headers.get('origin'))
  try {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown }
    const id = typeof body.id === 'string' ? body.id : ''
    if (!/^[A-Za-z0-9._-]{8,128}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400, headers })
    }

    // Lazy client: the site deploys fine before Sanity is configured, and this
    // route is the only thing that needs to say so.
    const previewClient = getPreviewClient()
    if (!previewClient) {
      console.error('[DMR budget request] NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
      return NextResponse.json({ error: 'Dashboard is not configured' }, { status: 503, headers })
    }

    const doc = await previewClient.fetch<BudgetRequestDoc | null>(
      `*[_id == $id && _type == "dmrBudgetRequest"][0]`,
      { id },
    )
    if (!doc) return NextResponse.json({ error: 'Request not found' }, { status: 404, headers })
    if (doc.emailedAt) return NextResponse.json({ success: true, alreadySent: true }, { headers })
    if (Date.now() - new Date(doc._createdAt).getTime() > MAX_AGE_MS) {
      return NextResponse.json({ error: 'Request expired' }, { status: 410, headers })
    }
    if (!process.env.SENDGRID_API_KEY) {
      console.error('[DMR budget request] SENDGRID_API_KEY is not set')
      return NextResponse.json({ error: 'Email is not configured' }, { status: 503, headers })
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send({
      to: DMR_TEAM_EMAIL,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@sendgrid.net',
        name: 'DMR Client Dashboard',
      },
      ...(doc.requestedByEmail ? { replyTo: doc.requestedByEmail } : {}),
      subject: `Budget change: ${doc.clientName ?? 'Client'} → ${usd(doc.requestedSpend)}/mo`,
      text: textEmail(doc),
      html: htmlEmail(doc),
    })

    // Mark as sent so a replayed id can't send twice. Non-fatal if the token can't write.
    await previewClient
      .patch(doc._id)
      .set({ emailedAt: new Date().toISOString() })
      .commit()
      .catch((err: unknown) => console.warn('[DMR budget request] could not stamp emailedAt', err))

    return NextResponse.json({ success: true }, { headers })
  } catch (err) {
    console.error('[DMR budget request] failed', err)
    return NextResponse.json({ error: 'Could not send request' }, { status: 500, headers })
  }
}

const usd = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—'
const pct = (n?: number) => (typeof n === 'number' ? `${Math.round(n * 100)}%` : '—')
const esc = (s = '') => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function lines(doc: BudgetRequestDoc): [string, string][] {
  const change = (doc.requestedSpend ?? 0) - (doc.currentSpend ?? 0)
  return [
    ['Client', doc.clientName ?? '—'],
    ['Current spend', `${usd(doc.currentSpend)}/mo`],
    ['Requested spend', `${usd(doc.requestedSpend)}/mo (${change >= 0 ? '+' : '−'}${usd(Math.abs(change))})`],
    ['Projected leads', doc.projection?.leads != null ? `~${Math.round(doc.projection.leads)}/mo` : '—'],
    ['Projected cost per lead', usd(doc.projection?.cpl)],
    ['Projected est. ROI', pct(doc.projection?.roi)],
    ['Based on', doc.baselineMonth ?? '—'],
    ['Requested by', [doc.requestedBy, doc.requestedByEmail].filter(Boolean).join(' · ') || '—'],
  ]
}

function textEmail(doc: BudgetRequestDoc) {
  return [
    'A client requested an ad spend change from their dashboard.',
    '',
    ...lines(doc).map(([k, v]) => `${k}: ${v}`),
    ...(doc.note ? ['', `Note: ${doc.note}`] : []),
    '',
    'Please confirm the change with the client once the budget is updated.',
  ].join('\n')
}

function htmlEmail(doc: BudgetRequestDoc) {
  const rows = lines(doc)
    .map(([k, v]) => `<tr><td style="padding:8px 0;color:#6b6b68;font-size:13px">${esc(k)}</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#0f0f0f">${esc(v)}</td></tr>`)
    .join('')
  return `<!DOCTYPE html><html><body style="margin:0;background:#fafaf9;font-family:Inter,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="font-family:Georgia,serif;font-size:26px;color:#0f0f0f">DMR</div>
    <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b68;margin:24px 0 6px">Budget change request</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;margin:0 0 20px;color:#0f0f0f">${esc(doc.clientName ?? 'Client')} → ${esc(usd(doc.requestedSpend))}/mo</h1>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e7e7e5">${rows}</table>
    ${doc.note ? `<p style="margin:20px 0 0;padding:14px 16px;background:#fff;border:1px solid #e7e7e5;font-size:14px;color:#3d3d3b"><strong>Note:</strong> ${esc(doc.note)}</p>` : ''}
    <p style="font-size:13px;color:#6b6b68;margin-top:24px">Please confirm the change with the client once the budget is updated.</p>
  </div></body></html>`
}
