import { Box, Card, Flex, Spinner, Text } from '@sanity/ui'
import { DashboardView } from './DashboardView'
import { dashboardCss } from './styles'
import { useSubmitBudgetRequest } from './budgetRequest'
import { useGoogleAdsSync } from './googleAdsSync'
import { useDashboardData } from './useDashboardData'
import { VersionFooter } from './VersionFooter'

/** Studio tool root: loads the client's report data and renders the two-pane dashboard, with the version strip under it. */
export function DmrDashboard() {
  const data = useDashboardData()
  const submitBudgetRequest = useSubmitBudgetRequest()
  const runSync = useGoogleAdsSync()

  return (
    <Card height="fill" className="dmr-root">
      <style>{dashboardCss}</style>
      <Flex direction="column" height="fill">
        <Box flex={1} className="dmr-main">
          {data.status === 'loading' ? (
            <Flex align="center" justify="center" height="fill" gap={3}>
              <Spinner muted />
              <Text size={1} muted>Loading your report…</Text>
            </Flex>
          ) : data.months.length === 0 ? (
            <Flex align="center" justify="center" height="fill">
              <Text size={1} muted>No reports yet. Your DMR team adds one each month.</Text>
            </Flex>
          ) : (
            <DashboardView
              settings={data.settings}
              months={data.months}
              isSample={data.isSample}
              submitBudgetRequest={submitBudgetRequest}
              sync={data.sync}
              runSync={runSync}
              onSynced={data.reload}
            />
          )}
        </Box>
        <VersionFooter />
      </Flex>
    </Card>
  )
}
