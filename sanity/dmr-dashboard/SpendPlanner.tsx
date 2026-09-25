import { useState } from 'react'
import { CheckmarkCircleIcon, ControlsIcon, EnvelopeIcon, InfoOutlineIcon, WarningOutlineIcon } from '@sanity/icons'
import { Badge, Box, Button, Card, Dialog, Flex, Stack, Text, TextArea } from '@sanity/ui'
import { monthLabel, num, pct, usd, type ClientSettings, type computeDashboard } from './math'
import { makePlanner, STEP_PCT, type Baseline } from './planner'
import { SpendKnob, type KnobZone } from './SpendKnob'
import { DMR_EMAIL } from './tokens'
import type { SubmitBudgetRequest } from './budgetRequest'

type Dash = ReturnType<typeof computeDashboard>

type SendState = { phase: 'idle' | 'confirm' | 'sending' } | { phase: 'done'; status: 'sent' | 'saved'; spend: number } | { phase: 'error' }

export function SpendPlanner({
  settings,
  d,
  isSample,
  submitBudgetRequest,
}: {
  settings: ClientSettings
  d: Dash
  isSample: boolean
  submitBudgetRequest: SubmitBudgetRequest
}) {
  const cur = d.current
  // Anchor on the selected month; fall back to the since-launch monthly average if it has no data.
  const base: Baseline =
    cur.spend > 0 && cur.leads > 0
      ? { spend: cur.spend, leads: cur.leads }
      : { spend: d.launch.spend / d.rows.length, leads: d.launch.leads / d.rows.length }
  const p = makePlanner(settings, base)
  const [value, setValue] = useState(base.spend)
  const [send, setSend] = useState<SendState>({ phase: 'idle' })
  const [note, setNote] = useState('')
  const now = p.current
  const next = p.project(value)
  const rec = p.recommendation
  const change = (value - base.spend) / base.spend
  const oneStepUp = base.spend * (1 + STEP_PCT)
  const oneStepDown = base.spend * (1 - STEP_PCT)
  const breakEvenLeads = Math.ceil(next.cost / p.valuePerLead)

  const zones: KnobZone[] = []
  if (p.breakEven && p.breakEven > p.min) zones.push({ from: p.min, to: p.breakEven, tone: 'critical', label: 'Below break-even' })
  const recLo = Math.min(base.spend, rec.spend)
  const recHi = rec.action === 'hold' ? base.spend * 1.1 : Math.max(base.spend, rec.spend)
  zones.push({ from: rec.action === 'hold' ? base.spend * 0.9 : recLo, to: recHi, tone: 'positive', label: 'Recommended' })
  zones.push({ from: Math.max(oneStepUp, recHi), to: p.max, tone: 'caution', label: 'More than one step' })

  const snap = (v: number) => (Math.abs(v - base.spend) < 1 ? base.spend : Math.round(v / 50) * 50)
  const presets = [
    { label: '−20%', v: oneStepDown },
    { label: 'Today', v: base.spend },
    { label: '+20%', v: oneStepUp },
    { label: '+50%', v: base.spend * 1.5 },
  ]

  const rows: { label: string; now: string; next: string; delta?: string; good?: boolean }[] = [
    { label: 'Monthly ad spend', now: usd(base.spend), next: usd(value), delta: signed(value - base.spend, usd) },
    { label: 'Leads per month', now: num(now.leads), next: num(next.leads), delta: signed(next.leads - now.leads, (n) => num(n)), good: next.leads >= now.leads },
    { label: 'Cost per lead', now: usd(now.cpl), next: usd(next.cpl), delta: signed(next.cpl - now.cpl, usd), good: next.cpl <= now.cpl },
    { label: 'Cost of the next lead', now: usd(now.marginalCpl), next: usd(next.marginalCpl) },
    { label: 'Est. closings per month', now: num(now.closings, 2), next: num(next.closings, 2) },
    { label: 'Est. commission', now: usd(now.commission), next: usd(next.commission), delta: signed(next.commission - now.commission, usd), good: next.commission >= now.commission },
    { label: 'Invested (spend + fee)', now: usd(now.cost), next: usd(next.cost) },
    { label: 'Est. return after costs', now: usd(now.commission - now.cost), next: usd(next.commission - next.cost), delta: signed(next.commission - next.cost - (now.commission - now.cost), usd), good: next.commission - next.cost >= now.commission - now.cost },
  ]

  const guidelines = [
    {
      ok: next.leads >= breakEvenLeads,
      title: `Need ${num(breakEvenLeads)} leads at this budget`,
      body: `That's what covers ${usd(next.cost)} in spend + fee at a ${pct(settings.closeRate)} close rate. Projected: ${num(next.leads)}.`,
    },
    {
      ok: Math.abs(change) <= STEP_PCT + 0.02, // small allowance for rounding to $50
      title: `Move about ${pct(STEP_PCT)} per month`,
      body: `Bigger jumps make Google's bidding re-learn and cost per lead can spike for a few weeks. One step from today: ${usd(oneStepDown)}–${usd(oneStepUp)}.`,
    },
    {
      ok: next.marginalCpl <= settings.industryCpl,
      title: `Keep the next lead under ${usd(settings.industryCpl)}`,
      body: p.diminishingAt
        ? `Past about ${usd(p.diminishingAt)}/mo, each extra lead costs more than the industry average.`
        : `At this budget the next lead costs about ${usd(next.marginalCpl)}, versus the ${usd(settings.industryCpl)} industry average.`,
    },
    {
      ok: d.launch.roi >= 1,
      title: 'Judge on since-launch ROI',
      body: `Online leads take 100+ days to close. Since launch you're at ${pct(d.launch.roi)} estimated ROI.`,
    },
  ]

  const unchanged = Math.abs(value - base.spend) < 1
  const inZone = (tone: 'critical' | 'positive' | 'caution') => zones.some((z) => z.tone === tone && value >= z.from - 0.5 && value <= z.to + 0.5)
  const status: { tone: 'critical' | 'positive' | 'caution' | 'neutral'; label: string } = inZone('critical')
    ? { tone: 'critical', label: 'Below break-even' }
    : unchanged
      ? { tone: 'neutral', label: 'Today’s budget' }
      : inZone('positive')
        ? { tone: 'positive', label: '✓ In the recommended range' }
        : Math.abs(change) > STEP_PCT + 0.02
          ? { tone: 'caution', label: 'Bigger than one step: phase it in' }
          : { tone: 'neutral', label: 'Within one step of today' }
  // Shared by every "Adjust ad spend" button: always opens the confirm pop-up.
  // If the dial hasn't moved yet, start from DMR's recommendation (or one step up).
  const openAdjust = () => {
    if (unchanged) {
      const target = Math.abs(rec.spend - base.spend) >= 1 ? rec.spend : Math.round((base.spend * (1 + STEP_PCT)) / 50) * 50
      setValue(Math.min(p.max, Math.max(p.min, target)))
    }
    setSend({ phase: 'confirm' })
  }

  const submit = async () => {
    setSend({ phase: 'sending' })
    try {
      const res = await submitBudgetRequest({
        clientName: settings.clientName,
        currentSpend: Math.round(base.spend),
        requestedSpend: Math.round(value),
        baselineMonth: cur.month,
        projection: { leads: next.leads, cpl: next.cpl, roi: next.roi, commission: next.commission },
        note,
      })
      setSend({ phase: 'done', status: res.status, spend: value })
      setNote('')
    } catch {
      setSend({ phase: 'error' })
    }
  }

  return (
    <Stack space={4}>
      {/* Header row: title left, primary action top right */}
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Stack space={2} className="dmr-min0">
          <Text size={2} weight="semibold">Plan your monthly budget</Text>
          <Text size={1} muted>Turn the dial to see estimated leads and ROI, then send the change to your DMR team.</Text>
        </Stack>
        <Button
          icon={ControlsIcon}
          text="Adjust ad spend"
          tone="primary"
          fontSize={1}
          padding={3}
          disabled={send.phase === 'sending'}
          onClick={openAdjust}
        />
      </Flex>

      {send.phase === 'done' && (
        <Card padding={4} radius={2} tone={send.status === 'sent' ? 'positive' : 'caution'} border>
          <Flex gap={3} align="flex-start">
            <Text size={2}>{send.status === 'sent' ? <CheckmarkCircleIcon /> : <WarningOutlineIcon />}</Text>
            <Stack space={3} flex={1}>
              <Text size={1} weight="semibold">
                {send.status === 'sent'
                  ? `Request sent: ${usd(send.spend)}/mo`
                  : `Request saved: ${usd(send.spend)}/mo`}
              </Text>
              <Text size={1} muted>
                {send.status === 'sent'
                  ? 'The DMR team will reach out shortly to confirm your ad spend has been adjusted.'
                  : <>We saved your request, but the email to DMR didn’t go through. Please also email <a href={requestMailto(settings, send.spend, base.spend, p.project(send.spend))}>{DMR_EMAIL}</a> so the team sees it right away.</>}
              </Text>
            </Stack>
          </Flex>
        </Card>
      )}
      {send.phase === 'error' && (
        <Card padding={4} radius={2} tone="critical" border>
          <Text size={1}>
            Couldn’t send your request. Please email <a href={requestMailto(settings, value, base.spend, next)}>{DMR_EMAIL}</a> instead.
          </Text>
        </Card>
      )}

      {(send.phase === 'confirm' || send.phase === 'sending') && (
        <Dialog
          id="dmr-adjust-spend"
          header="Adjust ad spend"
          width={1}
          onClose={() => send.phase !== 'sending' && setSend({ phase: 'idle' })}
          footer={
            <Flex gap={2} justify="flex-end" padding={3}>
              <Button text="Cancel" mode="bleed" fontSize={1} disabled={send.phase === 'sending'} onClick={() => setSend({ phase: 'idle' })} />
              <Button
                icon={EnvelopeIcon}
                text={send.phase === 'sending' ? 'Sending…' : 'Send to DMR'}
                tone="primary"
                fontSize={1}
                loading={send.phase === 'sending'}
                disabled={isSample}
                onClick={submit}
              />
            </Flex>
          }
        >
          <Box padding={4}>
            <Stack space={4}>
              <Flex align="center" gap={3} wrap="wrap">
                <span className="dmr-num dmr-num-sm">{usd(base.spend)}</span>
                <Text size={2} muted>→</Text>
                <span className="dmr-num dmr-num-sm dmr-num-accent">{usd(value)}</span>
                <Text size={1} muted>per month</Text>
              </Flex>
              <Card padding={3} radius={2} tone="transparent" border>
                <Stack space={3}>
                  <Text size={1}>~{num(next.leads)} leads/mo · {usd(next.cpl)} cost per lead · {pct(next.roi)} est. ROI</Text>
                  <Text size={1} muted>Projection from your {monthLabel(cur.month)} numbers.</Text>
                </Stack>
              </Card>
              <Stack space={2}>
                <Text size={1} weight="medium">Note for the team (optional)</Text>
                <TextArea
                  rows={3}
                  fontSize={1}
                  value={note}
                  placeholder="e.g. Start on the 1st, put the extra budget into Performance Max"
                  onChange={(e) => setNote(e.currentTarget.value)}
                />
              </Stack>
              <Text size={1} muted>
                {isSample
                  ? 'This is sample data, so sending is turned off. It works once your real report is loaded.'
                  : 'This emails your DMR team. They’ll reach out shortly to confirm once the budget is adjusted.'}
              </Text>
            </Stack>
          </Box>
        </Dialog>
      )}

      <div className="dmr-tiles dmr-tiles-planner">
        {/* Knob */}
        <Card className="dmr-tile dmr-knob-tile" padding={4}>
          <Stack space={4}>
            <SpendKnob value={value} min={p.min} max={p.max} current={base.spend} zones={zones} onChange={setValue} />

            <div className={`dmr-k-status is-${status.tone}`} role="status">
              <span className="dmr-k-status-dot" />
              <strong>{status.label}</strong>
              <span className="dmr-k-status-delta">
                {unchanged ? usd(base.spend) + '/mo' : `${signed(value - base.spend, usd)} (${signed(change * 100, (n) => `${Math.round(n)}%`)}) vs. today`}
              </span>
            </div>

            <div className="dmr-k-controls">
              <button type="button" className="dmr-k-step" aria-label="Decrease $50" onClick={() => setValue(Math.max(p.min, value - 50))}>−</button>
              <div className="dmr-k-seg" role="group" aria-label="Quick budgets">
                {presets.map((pr) => (
                  <button
                    key={pr.label}
                    type="button"
                    aria-pressed={Math.abs(snap(pr.v) - value) < 1}
                    onClick={() => setValue(Math.min(p.max, Math.max(p.min, snap(pr.v))))}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
              <button type="button" className="dmr-k-step" aria-label="Increase $50" onClick={() => setValue(Math.min(p.max, value + 50))}>+</button>
            </div>
            <Text size={0} muted align="center">Drag the dial, or use ← → keys (±$50)</Text>
          </Stack>
        </Card>

        {/* Now vs. projected */}
        <Card className="dmr-tile">
          <Box padding={4} paddingBottom={3}>
            <Flex align="baseline" justify="space-between" gap={3} wrap="wrap">
              <Text size={1} weight="semibold">Estimated ROI</Text>
              <Text size={1} muted>based on {monthLabel(cur.month)}</Text>
            </Flex>
            <Flex gap={5} marginTop={4} wrap="wrap" align="flex-end">
              <Stack space={3}>
                <Text size={1} muted>Now</Text>
                <span className="dmr-num">{pct(now.roi)}</span>
              </Stack>
              <Text size={2} muted>→</Text>
              <Stack space={3}>
                <Text size={1} muted>At {usd(value)}/mo</Text>
                <span className="dmr-num dmr-num-accent">{pct(next.roi)}</span>
              </Stack>
            </Flex>
          </Box>
          <table className="dmr-table">
            <thead>
              <tr><th>Per month</th><th>Now</th><th>Projected</th><th className="dmr-hide-sm">Change</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td>{r.now}</td>
                  <td><strong>{r.next}</strong></td>
                  <td className={`dmr-hide-sm ${r.delta && r.good !== undefined ? (r.good ? 'dmr-up' : 'dmr-down') : 'dmr-muted'}`}>{r.delta ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Recommendation */}
      <div className="dmr-tiles">
        <Card className="dmr-tile" padding={4}>
          <Flex gap={4} align="center" wrap="wrap">
            <Stack space={3} flex={1} style={{ minWidth: 260 }}>
              <Flex align="center" gap={2}>
                <Badge tone={rec.action === 'increase' ? 'positive' : rec.action === 'hold' ? 'primary' : 'critical'} fontSize={0}>
                  DMR recommends · {rec.action}
                </Badge>
              </Flex>
              <Text size={2} weight="semibold">
                {rec.action === 'hold' ? `Hold at ${usd(rec.spend)}/mo` : `${rec.action === 'increase' ? 'Raise' : 'Lower'} to ${usd(rec.spend)}/mo`}
                <span className="dmr-header-sub"> · {num(p.project(rec.spend).leads)} leads, {pct(p.project(rec.spend).roi)} est. ROI</span>
              </Text>
              <Text size={1} muted>{rec.reason}</Text>
            </Stack>
            <Flex gap={2} wrap="wrap">
              <Button text={`Set dial to ${usd(rec.spend)}`} mode="ghost" fontSize={1} onClick={() => setValue(rec.spend)} />
              <Button
                icon={EnvelopeIcon}
                text={unchanged ? 'Adjust ad spend' : `Request ${usd(value)}/mo`}
                mode="ghost"
                fontSize={1}
                disabled={send.phase === 'sending'}
                onClick={openAdjust}
              />
            </Flex>
          </Flex>
        </Card>
      </div>

      {/* Guidelines */}
      <div className="dmr-tiles dmr-tiles-4">
        {guidelines.map((g) => (
          <Card key={g.title} className="dmr-tile" padding={4}>
            <Stack space={3}>
              <span className={`dmr-guide-icon ${g.ok ? 'dmr-up' : 'dmr-warn'}`}>{g.ok ? <CheckmarkCircleIcon /> : <WarningOutlineIcon />}</span>
              <Text size={1} weight="semibold">{g.title}</Text>
              <Text size={1} muted>{g.body}</Text>
            </Stack>
          </Card>
        ))}
      </div>

      <Flex gap={2} align="flex-start">
        <Text size={1} muted><InfoOutlineIcon /></Text>
        <Text size={1} muted>
          Projection assumes leads grow with budget at diminishing returns (efficiency {p.e}: doubling spend gives about {num(2 ** p.e, 1)}× the leads),
          anchored on {monthLabel(cur.month)}. Commission uses the same low estimate as your report. Real results depend on search volume in your market;
          your DMR team confirms any change before it goes live.
        </Text>
      </Flex>
    </Stack>
  )
}

function signed(n: number, fmt: (n: number) => string) {
  if (Math.abs(n) < 0.5) return '—'
  return `${n > 0 ? '+' : '−'}${fmt(Math.abs(n))}`
}

function requestMailto(settings: ClientSettings, value: number, current: number, next: ReturnType<ReturnType<typeof makePlanner>['project']>) {
  const subject = encodeURIComponent(`${settings.clientName} · Budget change request: ${usd(value)}/mo`)
  const body = encodeURIComponent(
    [
      'Hi DMR team,',
      '',
      `I'd like to change my monthly ad spend from ${usd(current)} to ${usd(value)}.`,
      '',
      'Dashboard projection:',
      `• Leads per month: ~${num(next.leads)}`,
      `• Cost per lead: ~${usd(next.cpl)}`,
      `• Est. ROI: ${pct(next.roi)}`,
      '',
      `— Sent from the ${settings.clientName} dashboard`,
    ].join('\n'),
  )
  return `mailto:${DMR_EMAIL}?subject=${subject}&body=${body}`
}
