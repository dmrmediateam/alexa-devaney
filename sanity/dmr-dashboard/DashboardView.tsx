import { useEffect, useState, type ComponentType } from 'react'
import {
  BarChartIcon,
  BoltIcon,
  CloseIcon,
  CalendarIcon,
  ChartUpwardIcon,
  ChevronRightIcon,
  ControlsIcon,
  CopyIcon,
  DocumentsIcon,
  EnvelopeIcon,
  HelpCircleIcon,
  LaunchIcon,
  RobotIcon,
  TrendUpwardIcon,
} from '@sanity/icons'
import { Badge, Box, Button, Card, Flex, Select, Stack, Tab, TabList, Text } from '@sanity/ui'
import { MetricChart } from './MetricChart'
import { SpendPlanner } from './SpendPlanner'
import type { SubmitBudgetRequest } from './budgetRequest'
import { computeDashboard, monthLabel, num, pct, usd, type ClientSettings, type MonthReport } from './math'
import { DMR_EMAIL, DMR_SITE } from './tokens'

/**
 * Two-pane layout that mirrors the Studio's Structure tool: a list pane on the left
 * (pane header + list items with media boxes, chevrons, selected state) and an editor-style
 * pane on the right with a fixed header and a rigid, hairline-divided tile grid
 * (Mora / Stripe product dashboards on Mobbin). Chrome uses @sanity/ui so it inherits the
 * Studio theme; numbers use DMR Media's Instrument Serif and blue accent.
 */

type Section = 'overview' | 'spend' | 'campaigns' | 'months' | 'roi' | 'playbook' | 'contact'
type MetricKey = 'leads' | 'spend' | 'cpl' | 'commission'

const SECTIONS: { key: Section; title: string; subtitle: string; icon: ComponentType }[] = [
  { key: 'overview', title: 'Overview', subtitle: 'ROI, leads and spend', icon: ChartUpwardIcon },
  { key: 'spend', title: 'Ad spend planner', subtitle: 'Try a budget, see est. ROI', icon: ControlsIcon },
  { key: 'campaigns', title: 'Campaigns', subtitle: 'Where your leads came from', icon: BarChartIcon },
  { key: 'months', title: 'Month by month', subtitle: 'Every month since launch', icon: CalendarIcon },
  { key: 'roi', title: 'ROI math', subtitle: 'How the numbers are built', icon: TrendUpwardIcon },
  { key: 'playbook', title: 'Follow-up playbook', subtitle: 'SOP, scripts and texts', icon: DocumentsIcon },
]
const CONTACT = { key: 'contact' as const, title: 'Contact DMR', subtitle: DMR_EMAIL, icon: EnvelopeIcon }

export function DashboardView({
  settings,
  months,
  isSample,
  submitBudgetRequest,
}: {
  settings: ClientSettings
  months: MonthReport[]
  isSample: boolean
  submitBudgetRequest: SubmitBudgetRequest
}) {
  const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month))
  const [idx, setIdx] = useState(sorted.length - 1)
  const [section, setSection] = useState<Section>('overview')
  const d = computeDashboard(settings, sorted.slice(0, idx + 1))
  const active = [...SECTIONS, CONTACT].find((s) => s.key === section)!

  return (
    <Flex className="dmr-tool" height="fill">
      {/* ── List pane ─────────────────────────────────────── */}
      <Card className="dmr-list-pane" borderRight>
        <Flex direction="column" height="fill">
          <Card className="dmr-pane-header" borderBottom paddingX={3}>
            <Flex align="center" height="fill" gap={2}>
              <Box flex={1}>
                <Text size={1} weight="semibold">Dashboard</Text>
              </Box>
              {isSample && <Badge tone="caution" fontSize={0}>Sample data</Badge>}
            </Flex>
          </Card>

          <Box padding={2} flex={1} className="dmr-list-scroll">
            <Stack space={1}>
              {SECTIONS.map((s) => (
                <ListItem key={s.key} item={s} selected={section === s.key} onClick={() => setSection(s.key)} />
              ))}
            </Stack>
            <Box paddingY={2}><Card borderTop /></Box>
            <ListItem item={CONTACT} selected={section === 'contact'} onClick={() => setSection('contact')} />
          </Box>

          <Card borderTop padding={3} className="dmr-list-foot">
            <Flex align="center" gap={2}>
              <span className="dmr-wordmark">DMR</span>
              <Box flex={1}>
                <Text size={0} muted>DMR Media Specialists</Text>
              </Box>
              <Button
                as="a"
                href={DMR_SITE}
                target="_blank"
                rel="noreferrer"
                icon={LaunchIcon}
                mode="bleed"
                fontSize={1}
                padding={2}
                aria-label="Open dmrmedia.org"
              />
            </Flex>
          </Card>
        </Flex>
      </Card>

      {/* ── Content pane ──────────────────────────────────── */}
      <Card className="dmr-content-pane" flex={1}>
        <Flex direction="column" height="fill">
          <Card className="dmr-pane-header" borderBottom paddingX={4}>
            <Flex align="center" height="fill" gap={3}>
              <Box flex={1} className="dmr-min0">
                <Text size={1} weight="semibold" textOverflow="ellipsis">
                  {active.title}
                  <span className="dmr-header-sub"> · {settings.clientName}</span>
                </Text>
              </Box>
              <Box className="dmr-month">
                <Select
                  fontSize={1}
                  padding={2}
                  value={idx}
                  onChange={(e) => setIdx(Number(e.currentTarget.value))}
                  aria-label="Report month"
                >
                  {sorted.map((m, i) => (
                    <option key={m.month} value={i}>{monthLabel(m.month)}</option>
                  ))}
                </Select>
              </Box>
              <Button
                as="a"
                href={mailto(settings, `Question about my ${monthLabel(d.current.month)} report`)}
                icon={EnvelopeIcon}
                text="Email DMR"
                tone="primary"
                fontSize={1}
                padding={2}
                className="dmr-header-btn"
              />
            </Flex>
          </Card>

          <Box className="dmr-content-scroll" padding={4} flex={1}>
            {section === 'overview' && <Overview settings={settings} d={d} />}
            {section === 'spend' && <SpendPlanner key={d.current.month} settings={settings} d={d} isSample={isSample} submitBudgetRequest={submitBudgetRequest} />}
            {section === 'campaigns' && <Campaigns d={d} />}
            {section === 'months' && <Months d={d} />}
            {section === 'roi' && <RoiMath settings={settings} d={d} />}
            {section === 'playbook' && <Playbook settings={settings} />}
            {section === 'contact' && <Contact settings={settings} />}
          </Box>
        </Flex>
      </Card>
    </Flex>
  )
}

type Dash = ReturnType<typeof computeDashboard>

/* ── List item (mirrors Structure pane items) ─────────────── */

function ListItem({ item, selected, onClick }: { item: { title: string; subtitle: string; icon: ComponentType }; selected: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <Card
      as="button"
      type="button"
      className="dmr-item"
      padding={2}
      radius={2}
      selected={selected}
      pressed={selected}
      onClick={onClick}
      data-as="button"
    >
      <Flex align="center" gap={2}>
        <Card className="dmr-item-media" radius={2} border>
          <Flex align="center" justify="center" height="fill">
            <Text size={2}><Icon /></Text>
          </Flex>
        </Card>
        <Stack space={2} flex={1} className="dmr-min0">
          <Text size={1} weight="medium" textOverflow="ellipsis">{item.title}</Text>
          <Text size={1} muted textOverflow="ellipsis">{item.subtitle}</Text>
        </Stack>
        <Text size={1} muted><ChevronRightIcon /></Text>
      </Flex>
    </Card>
  )
}

/* ── Overview: simple on purpose ──────────────────────────── */

function Overview({ settings, d }: { settings: ClientSettings; d: Dash }) {
  const [metric, setMetric] = useState<MetricKey>('leads')
  const cur = d.current
  const metrics: { key: MetricKey; label: string; format: (n: number) => string }[] = [
    { key: 'leads', label: 'Leads', format: (n) => num(n) },
    { key: 'spend', label: 'Ad spend', format: (n) => usd(n) },
    { key: 'cpl', label: 'Cost per lead', format: (n) => usd(n) },
    { key: 'commission', label: 'Est. commission', format: (n) => usd(n) },
  ]
  const active = metrics.find((m) => m.key === metric)!

  return (
    <Stack space={4}>
      <div className="dmr-tiles dmr-tiles-4">
        <Tile label="Est. ROI · since launch" value={pct(d.launch.roi)} note={`${pct(cur.roi)} this month`} hero />
        <Tile label="Leads" value={num(cur.leads)} note={`${num(d.launch.leads)} since launch`} />
        <Tile
          label="Cost per lead"
          value={usd(cur.cpl)}
          note={`Industry avg ${usd(settings.industryCpl)}`}
          badge={d.cplVsIndustry > 0 ? `${pct(d.cplVsIndustry)} below` : undefined}
        />
        <Tile label="Ad spend" value={usd(cur.spend)} note={`${usd(d.launch.spend)} since launch`} />
      </div>

      <div className="dmr-tiles">
        <Card className="dmr-tile" padding={4}>
          <Flex align="center" justify="space-between" gap={3} wrap="wrap">
            <Text size={1} weight="semibold">{active.label} by month</Text>
            <TabList space={1}>
              {metrics.map((m) => (
                <Tab
                  key={m.key}
                  id={`dmr-metric-${m.key}`}
                  aria-controls="dmr-metric-chart"
                  label={m.label}
                  fontSize={1}
                  padding={2}
                  selected={metric === m.key}
                  onClick={() => setMetric(m.key)}
                />
              ))}
            </TabList>
          </Flex>
          <Box marginTop={4} id="dmr-metric-chart">
            <MetricChart
              label={active.label}
              format={active.format}
              points={d.rows.map((r) => ({ month: r.month, value: r[metric] }))}
            />
          </Box>
        </Card>
      </div>

      <div className="dmr-tiles dmr-tiles-4">
        <Tile small label="Est. commission to date" value={usd(d.launch.commission)} />
        <Tile small label="Invested to date" value={usd(d.launch.cost)} note="Ad spend + DMR fee" />
        <Tile small label="One closing pays you" value={usd(d.valuePerClose)} />
        <Tile small label="Leads to break even" value={num(d.breakEvenLeads)} note={`You had ${num(cur.leads)} in ${monthLabel(cur.month, 'short')}`} />
      </div>
    </Stack>
  )
}

/* ── Campaigns ────────────────────────────────────────────── */

function Campaigns({ d }: { d: Dash }) {
  const cur = d.current
  const maxLeads = Math.max(1, ...cur.campaigns.map((c) => c.leads))
  return (
    <Stack space={3}>
      <div className="dmr-tiles">
        <Card className="dmr-tile">
          {cur.campaigns.length ? (
            <table className="dmr-table">
              <thead>
                <tr><th>Campaign</th><th>Spend</th><th>Leads</th><th className="dmr-hide-sm">Share of leads</th><th>Cost per lead</th></tr>
              </thead>
              <tbody>
                {cur.campaigns.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <Stack space={2}>
                        <Text size={1} weight="medium">{c.name}</Text>
                        {c.subtitle && <Text size={1} muted>{c.subtitle}</Text>}
                      </Stack>
                    </td>
                    <td>{usd(c.spend)}</td>
                    <td>{num(c.leads)}</td>
                    <td className="dmr-hide-sm">
                      <span className="dmr-share">
                        <span className="dmr-share-bar"><span style={{ width: `${(c.leads / maxLeads) * 100}%` }} /></span>
                        <span className="dmr-share-num">{cur.leads ? pct(c.leads / cur.leads) : '—'}</span>
                      </span>
                    </td>
                    <td>{c.leads ? usd(c.spend / c.leads) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td>Paid total</td><td>{usd(cur.spend)}</td><td>{num(cur.leads)}</td><td className="dmr-hide-sm" /><td>{usd(cur.cpl)}</td></tr>
              </tfoot>
            </table>
          ) : (
            <Box padding={4}><Text size={1} muted>No campaign breakdown for {monthLabel(cur.month)}.</Text></Box>
          )}
        </Card>
      </div>
      {cur.footnote && <Text size={1} muted>{cur.footnote}</Text>}
    </Stack>
  )
}

/* ── Month by month ───────────────────────────────────────── */

function Months({ d }: { d: Dash }) {
  return (
    <div className="dmr-tiles">
      <Card className="dmr-tile">
        <table className="dmr-table">
          <thead>
            <tr><th>Month</th><th>Leads</th><th>Spend</th><th>Cost per lead</th><th className="dmr-hide-sm">Est. commission</th><th>Est. ROI</th></tr>
          </thead>
          <tbody>
            {[...d.rows].reverse().map((r) => (
              <tr key={r.month}>
                <td><Text size={1} weight="medium">{monthLabel(r.month)}</Text></td>
                <td>{num(r.leads)}</td>
                <td>{usd(r.spend)}</td>
                <td>{usd(r.cpl)}</td>
                <td className="dmr-hide-sm">{usd(r.commission)}</td>
                <td>{pct(r.roi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

/* ── ROI math ─────────────────────────────────────────────── */

function RoiMath({ settings, d }: { settings: ClientSettings; d: Dash }) {
  const cur = d.current
  const first = d.launch.firstMonth ? monthLabel(d.launch.firstMonth, 'short') : ''
  return (
    <Stack space={4}>
      <div className="dmr-tiles dmr-tiles-2">
        <MathTile title="What one closing pays you" rows={[
          [`Average home price · ${settings.market}`, usd(settings.avgHomePrice)],
          [`× ${pct(settings.commissionRate)} commission, one side only`, usd(settings.avgHomePrice * settings.commissionRate)],
        ]} total={[`× ${pct(settings.agentSplit)} your split`, usd(d.valuePerClose)]} />
        <MathTile title="What it takes" rows={[
          ['Leads per month to break even', num(d.breakEvenLeads)],
          [`Every ${num(1 / settings.closeRate)} leads = 1 closing =`, usd(d.valuePerClose)],
        ]} />
        <MathTile title={`This month · ${monthLabel(cur.month)}`} rows={[
          [`${num(cur.leads)} leads × ${pct(settings.closeRate)} lead-to-close`, `${num(cur.leads * settings.closeRate, 2)} closings`],
          ['= Estimated commission', usd(cur.commission)],
          [`Ad spend ${usd(cur.spend)} + fee ${usd(settings.monthlyFee)}`, usd(cur.cost)],
        ]} total={['Estimated ROI', pct(cur.roi)]} />
        <MathTile title={`Since launch · ${first} to ${monthLabel(cur.month, 'short')}`} rows={[
          [`${num(d.launch.leads)} leads × ${pct(settings.closeRate)} lead-to-close`, `${num(d.launch.closings, 2)} closings`],
          ['= Estimated commission', usd(d.launch.commission)],
          [`Ad spend ${usd(d.launch.spend)} + fees ${usd(d.launch.fees)}`, usd(d.launch.cost)],
        ]} total={['Estimated ROI', pct(d.launch.roi)]} />
      </div>
      <div className="dmr-tiles">
        <Card className="dmr-tile">
          <Box padding={4} paddingBottom={2}>
            <Flex align="center" gap={2}>
              <Text size={1} muted><HelpCircleIcon /></Text>
              <Text size={1} weight="semibold">What each number means</Text>
            </Flex>
          </Box>
          <div className="dmr-faq">
            {glossary(settings, d.valuePerClose).map(([q, a]) => (
              <details key={q}>
                <summary><Text size={1} weight="medium">{q}</Text><span className="dmr-chev"><ChevronRightIcon /></span></summary>
                <Box paddingBottom={3}><Text size={1} muted>{a}</Text></Box>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </Stack>
  )
}

/* ── Playbook ─────────────────────────────────────────────── */

function aiMailto(settings: ClientSettings) {
  const s = encodeURIComponent(`${settings.clientName} · AI lead follow-up`)
  const b = encodeURIComponent(
    `Hi DMR team,\n\nI'd like the AI assistant to follow up with my leads by text and email.\nCan you check whether it works with my CRM?\n\n— Sent from the ${settings.clientName} dashboard`,
  )
  return `mailto:${DMR_EMAIL}?subject=${s}&body=${b}`
}

function Playbook({ settings }: { settings: ClientSettings }) {
  // "Pop-up" callout on the AI block: pops in shortly after the section opens, dismissible.
  const [showPop, setShowPop] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowPop(true), 500)
    return () => clearTimeout(t)
  }, [])
  const steps = [
    ['Within 5 minutes', 'Call every new lead. Leads reached in 5 minutes are ~21x more likely to qualify than after 30.'],
    ['Days 1–7', 'Two dials a day for 7 days. Scripts, texts and emails are written for you.'],
    ['After day 7', 'Follow up weekly.'],
  ]
  const links = [
    { title: '7-day sprint SOP', href: settings.sprintSopUrl },
    { title: 'Scripts, texts & emails', href: settings.scriptsUrl },
    { title: 'Property inquiry script (website leads)', href: settings.propertyScriptUrl },
  ].filter((l) => l.href)
  return (
    <Stack space={4}>
      <div className="dmr-tiles dmr-tiles-3">
        {steps.map(([k, v], i) => (
          <Card key={k} className="dmr-tile" padding={4}>
            <Stack space={3}>
              <span className="dmr-step-n">{i + 1}</span>
              <Text size={1} weight="semibold">{k}</Text>
              <Text size={1} muted>{v}</Text>
            </Stack>
          </Card>
        ))}
      </div>
      <div className="dmr-tiles">
        <Card className="dmr-tile dmr-tile-ai" padding={4}>
          {showPop && (
            <div className="dmr-pop" role="status">
              <span className="dmr-pop-icon" aria-hidden="true"><BoltIcon /></span>
              <span>Reduces follow-up time by up to <strong>50%</strong> for agents!</span>
              <button type="button" className="dmr-pop-close" aria-label="Dismiss" onClick={() => setShowPop(false)}>
                <CloseIcon />
              </button>
            </div>
          )}
          <Flex gap={4} align="center" wrap="wrap">
            <Card className="dmr-item-media dmr-ai-media" radius={2} border>
              <Flex align="center" justify="center" height="fill"><Text size={2}><RobotIcon /></Text></Flex>
            </Card>
            <Stack space={3} flex={1} style={{ minWidth: 240 }}>
              <Text size={2} weight="semibold">Don’t want to follow up via text?</Text>
              <Text size={1} muted>
                Get our AI assistant to nurture your leads automatically by text and email, so every lead gets a fast reply,
                even when you’re busy.
              </Text>
              <Text size={0} muted>
                See if your CRM allows automated texts and emails. Your DMR team can help you check.
              </Text>
            </Stack>
            <Button
              as="a"
              href={aiMailto(settings)}
              icon={EnvelopeIcon}
              text="Ask about AI follow-up"
              tone="primary"
              fontSize={1}
            />
          </Flex>
        </Card>
      </div>
      <div className="dmr-tiles">
        {links.map((l) => (
          <Card key={l.title} as="a" href={l.href} target="_blank" rel="noreferrer" className="dmr-tile dmr-row-link" padding={4}>
            <Flex align="center" gap={3}>
              <Text size={1}><DocumentsIcon /></Text>
              <Box flex={1}><Text size={1} weight="medium">{l.title}</Text></Box>
              <Text size={1} muted><LaunchIcon /></Text>
            </Flex>
          </Card>
        ))}
      </div>
    </Stack>
  )
}

/* ── Contact ──────────────────────────────────────────────── */

const TOPICS = ['Question about my leads', 'Change my ad budget', 'Website update request', 'Book a strategy call']

function Contact({ settings }: { settings: ClientSettings }) {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard?.writeText(DMR_EMAIL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  return (
    <Stack space={4}>
      <div className="dmr-tiles">
        <Card className="dmr-tile" padding={4}>
          <Stack space={4}>
            <Text size={1} muted>Questions, budget changes, website edits: email your DMR team.</Text>
            <a className="dmr-contact-email" href={mailto(settings, 'Question from my dashboard')}>{DMR_EMAIL}</a>
            <Flex gap={2} wrap="wrap">
              <Button as="a" href={mailto(settings, 'Question from my dashboard')} icon={EnvelopeIcon} text="Write an email" tone="primary" fontSize={1} />
              <Button icon={CopyIcon} text={copied ? 'Copied' : 'Copy address'} mode="ghost" fontSize={1} onClick={copy} />
            </Flex>
          </Stack>
        </Card>
      </div>
      <div className="dmr-tiles">
        {TOPICS.map((t) => (
          <Card key={t} as="a" href={mailto(settings, t)} className="dmr-tile dmr-row-link" padding={4}>
            <Flex align="center" gap={3}>
              <Text size={1}><EnvelopeIcon /></Text>
              <Box flex={1}><Text size={1} weight="medium">{t}</Text></Box>
              <Text size={1} muted><ChevronRightIcon /></Text>
            </Flex>
          </Card>
        ))}
      </div>
    </Stack>
  )
}

/* ── Tiles ────────────────────────────────────────────────── */

function Tile({ label, value, note, badge, hero, small }: { label: string; value: string; note?: string; badge?: string; hero?: boolean; small?: boolean }) {
  return (
    <Card className={`dmr-tile${hero ? ' dmr-tile-hero' : ''}`} padding={4}>
      <Stack space={3}>
        <Text size={1} muted>{label}</Text>
        <span className={`dmr-num${small ? ' dmr-num-sm' : ''}`}>{value}</span>
        {(note || badge) && (
          <Flex align="center" gap={2} wrap="wrap">
            {badge && <Badge tone="positive" fontSize={0}>{badge}</Badge>}
            {note && <Text size={1} muted>{note}</Text>}
          </Flex>
        )}
      </Stack>
    </Card>
  )
}

function MathTile({ title, rows, total }: { title: string; rows: [string, string][]; total?: [string, string] }) {
  return (
    <Card className="dmr-tile" padding={4}>
      <Stack space={3}>
        <Text size={1} weight="semibold">{title}</Text>
        <dl className="dmr-math">
          {rows.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
          {total && <div className="dmr-math-total"><dt>{total[0]}</dt><dd>{total[1]}</dd></div>}
        </dl>
      </Stack>
    </Card>
  )
}

function mailto(settings: ClientSettings, subject: string) {
  const s = encodeURIComponent(`${settings.clientName} · ${subject}`)
  const b = encodeURIComponent(`Hi DMR team,\n\n\n\n— Sent from the ${settings.clientName} dashboard`)
  return `mailto:${DMR_EMAIL}?subject=${s}&body=${b}`
}

function glossary(s: ClientSettings, valuePerClose: number): [string, string][] {
  return [
    ['Estimated ROI', `What your leads are likely worth in commission, minus what you paid for them (ad spend plus our fee), as a percentage of what you paid. 100% means every dollar in came back as two. "Since launch" is the headline because online leads take 100+ days on average to become a closing, so any single month is too short to judge.`],
    ['Why it’s a low estimate', `Four choices, each made to understate: a ${pct(s.closeRate)} close rate (online-lead average is 0.4%–1.2%), one side of the commission only, the market’s median price rather than your own average sale, and paid leads only. Repeat business and referrals aren’t counted.`],
    ['Average home price', `${s.priceSource}. It sets the value of one closing: price × ${pct(s.commissionRate)} × ${pct(s.agentSplit)} = ${usd(valuePerClose)}. Send us your own 12-month average sale price and split and we’ll use those instead.`],
    ['Total leads', 'People who gave you their contact details through the ads: form submits, phone calls, sign-ups and Local Services messages. Page views and clicks are never counted as leads.'],
    ['Cost per lead vs. industry', `Ad spend divided by leads, compared with the LocaliQ/WordStream real estate benchmark of ${usd(s.industryCpl)} per lead across 13,000+ US campaigns.`],
    ['Ad spend', 'What Google charged for clicks. It goes to Google directly and is separate from our management fee.'],
    ['Leads per month to break even', `How many leads it takes, at a ${pct(s.closeRate)} close rate, for estimated commission to cover that month’s spend and fee. One month under it isn’t a problem; since launch is what counts.`],
    ['Search vs. Performance Max', 'Search catches people typing “homes for sale in your market”: highest intent, highest cost per lead. Performance Max follows people across Google, YouTube and Gmail: cheaper leads, earlier in their decision. Run both through the same follow-up.'],
    ['Sources', 'Close rate: NAR (0.4%–1.2%) via Follow Up Boss; Ylopo 0.5%–1.5%. Commission: Clever 2026 agent survey. Cost per lead: LocaliQ/WordStream 2026 Real Estate benchmarks. Speed to lead: Oldroyd, Lead Response Management study.'],
  ]
}
