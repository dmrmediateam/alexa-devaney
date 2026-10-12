/**
 * Imports leads from the lead sheet (Google Sheet or CSV export) into Sanity
 * as `dmrLead` documents, which the dashboard counts as the month's real leads.
 * New leads are written by /api/lead automatically; this is for backfill.
 *
 *   npx sanity exec scripts/import-leads.mjs --with-user-token -- <sheet URL or .csv> [--month 2026-09]
 *
 * --month files rows with a blank "Submitted (ET)" under that month. Safe to
 * re-run: ids come from each row's contents, so a lead is never duplicated.
 * Holds personal data: only run it against a PRIVATE dataset.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'

const args = process.argv.slice(2).filter((a) => a !== '--')
const monthFlag = args.indexOf('--month')
const fallbackMonth = monthFlag >= 0 ? args.splice(monthFlag, 2)[1] : null
const source = args[0]
if (!source) {
  console.error('Usage: npx sanity exec scripts/import-leads.mjs --with-user-token -- <sheet URL or .csv> [--month YYYY-MM]')
  process.exit(1)
}

async function loadCsv(src) {
  const sheet = src.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/)
  if (!sheet) return readFileSync(src, 'utf8')
  const gid = src.match(/[#&?]gid=(\d+)/)?.[1]
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheet[1]}/export?format=csv${gid ? `&gid=${gid}` : ''}`)
  if (!res.ok) throw new Error(`Could not export the sheet (${res.status}). Is it shared "anyone with the link"?`)
  return res.text()
}

/** RFC 4180 CSV: quoted fields may hold commas, quotes and newlines. */
function parseCsv(text) {
  const rows = [[]]
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') rows.at(-1).push(field), (field = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      rows.at(-1).push(field), (field = ''), rows.push([])
    } else field += c
  }
  rows.at(-1).push(field)
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()))
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

function monthOf(submitted) {
  if (!submitted) return fallbackMonth ? `${fallbackMonth.slice(0, 7)}-01` : null
  const d = new Date(submitted)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const rows = parseCsv(await loadCsv(source))
const docs = []
const skipped = []
for (const [i, row] of rows.entries()) {
  const month = monthOf(row['Submitted (ET)'])
  if (!month) {
    skipped.push(i + 2)
    continue
  }
  const page = row['Page'] || undefined
  const gclid = row['GCLID'] || undefined
  const key = [row['Submitted (ET)'], row['Full Name'], row['Email'], row['Phone'], row['Form'], gclid].join('|')
  docs.push({
    _id: `lead-import-${createHash('sha256').update(key).digest('hex').slice(0, 20)}`,
    _type: 'dmrLead',
    month,
    submittedAt: row['Submitted (ET)'] ? new Date(row['Submitted (ET)']).toISOString() : undefined,
    name: row['Full Name'] || undefined,
    email: row['Email'] || undefined,
    phone: row['Phone'] || undefined,
    form: row['Form'] || undefined,
    leadTag: row['Lead Tag'] || undefined,
    qualified: row['Qualified'].toUpperCase() === 'TRUE',
    qualificationReason: row['Qualification Reason'] || undefined,
    paid: Boolean(gclid),
    address: row['Property Address'] || undefined,
    city: row['City'] || undefined,
    zip: row['Zip'] || undefined,
    pricePoint: row['Price Point'] || undefined,
    estimatedValue: row['Estimated Value'] || undefined,
    financing: row['Financing'] || undefined,
    agentStatus: row['Agent Status'] || undefined,
    timeline: row['Timeline'] || undefined,
    mlsNumber: row['MLS Number'] || undefined,
    message: row['Message'] || undefined,
    page,
    gclid,
    campaignId: page?.match(/gad_campaignid=(\d+)/)?.[1] ?? (row['UTM Campaign'] || undefined),
    source: 'sheet import',
  })
}

const client = getCliClient({ apiVersion: '2025-01-01' })
const { aclMode } = await client.request({ url: `/projects/${client.config().projectId}/datasets` })
  .then((sets) => sets.find((d) => d.name === client.config().dataset) ?? {})
if (aclMode === 'public') {
  console.error(`Dataset "${client.config().dataset}" is PUBLIC: lead names, emails and phones would be readable by anyone.`)
  console.error('Make it private first: npx sanity dataset visibility set production private')
  process.exit(1)
}

const tx = client.transaction()
for (const doc of docs) tx.createOrReplace(Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined)))
if (docs.length) await tx.commit()

const byMonth = docs.reduce((acc, d) => ({ ...acc, [d.month.slice(0, 7)]: (acc[d.month.slice(0, 7)] ?? 0) + 1 }), {})
console.log(`Imported ${docs.length} leads: ${Object.entries(byMonth).map(([m, n]) => `${m} ${n}`).join(', ') || 'none'}`)
console.log(`  from a Google Ads click: ${docs.filter((d) => d.paid).length}, other: ${docs.filter((d) => !d.paid).length}`)
if (skipped.length) console.log(`Skipped rows ${skipped.join(', ')}: no "Submitted (ET)" date. Pass --month YYYY-MM to file them.`)
