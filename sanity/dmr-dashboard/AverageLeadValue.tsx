import { InfoOutlineIcon } from '@sanity/icons'
import { Card, Flex, Stack, Text } from '@sanity/ui'
import { monthLabel, num, pct, usd, type ClientSettings, type computeDashboard } from './math'

type Dash = ReturnType<typeof computeDashboard>

/**
 * What one lead is worth: Google Ads conversion value ÷ leads, or the
 * close-rate estimate for months Ads reports no value. Sits at the bottom of
 * the Overview and of the Ad spend planner, which values every projected lead
 * at `plannerValue`.
 */
export function AverageLeadValue({
  settings,
  d,
  plannerValue,
}: {
  settings: ClientSettings
  d: Dash
  /** Set on the planner: the value it puts on each projected lead. */
  plannerValue?: number
}) {
  const cur = d.current
  const months = d.rows.length
  const fromAds = cur.valueSource === 'googleAds'
  const estimateNote = `Estimate: ${pct(settings.closeRate)} close rate × ${usd(d.valuePerClose)} per closing`

  return (
    <Stack space={3}>
      <Stack space={2}>
        <Text size={2} weight="semibold">Average lead value</Text>
        <Text size={1} muted>
          What one lead is worth, from the conversion values in your Google Ads account. Est. ROI is built on it.
        </Text>
      </Stack>

      <div className="dmr-tiles dmr-tiles-3">
        <Card className="dmr-tile dmr-tile-hero" padding={4}>
          <Stack space={3}>
            <Text size={1} muted>Per lead · {monthLabel(cur.month)}</Text>
            <span className="dmr-num">{usd(cur.avgLeadValue)}</span>
            <Text size={1} muted>
              {!cur.leads
                ? `No leads yet this month. ${estimateNote}`
                : fromAds
                  ? `${usd(cur.value)} Google Ads conversion value ÷ ${num(cur.leads)} leads`
                  : `No Google Ads conversion value this month. ${estimateNote}`}
            </Text>
          </Stack>
        </Card>
        <Card className="dmr-tile" padding={4}>
          <Stack space={3}>
            <Text size={1} muted>Per lead · since launch</Text>
            <span className="dmr-num">{usd(d.launch.avgLeadValue)}</span>
            <Text size={1} muted>{usd(d.launch.value)} lead value ÷ {num(d.launch.leads)} leads</Text>
          </Stack>
        </Card>
        <Card className="dmr-tile" padding={4}>
          <Stack space={3}>
            <Text size={1} muted>Lead value · {monthLabel(cur.month, 'short')}</Text>
            <span className="dmr-num">{usd(cur.value)}</span>
            <Text size={1} muted>{pct(cur.roi)} est. ROI on {usd(cur.spend)} ad spend</Text>
          </Stack>
        </Card>
      </div>

      <Flex gap={2} align="flex-start">
        <Text size={1} muted><InfoOutlineIcon /></Text>
        <Text size={1} muted>
          {d.launch.adsMonths === months
            ? `Every month is valued from Google Ads conversion values.`
            : d.launch.adsMonths
              ? `${num(d.launch.adsMonths)} of ${num(months)} months are valued from Google Ads conversion values; the rest use the low estimate (${pct(settings.closeRate)} close rate × ${usd(d.valuePerClose)} per closing = ${usd(d.estimatedLeadValue)} a lead).`
              : `Google Ads isn't reporting conversion values yet, so every month uses the low estimate (${pct(settings.closeRate)} close rate × ${usd(d.valuePerClose)} per closing = ${usd(d.estimatedLeadValue)} a lead).`}
          {plannerValue !== undefined && ` The planner values each projected lead at ${usd(plannerValue)}.`}
        </Text>
      </Flex>
    </Stack>
  )
}
