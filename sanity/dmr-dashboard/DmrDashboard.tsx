import { Card, Flex, Spinner, Text } from '@sanity/ui'
import { DashboardView } from './DashboardView'
import { dashboardCss } from './styles'
import { useSubmitBudgetRequest } from './budgetRequest'
import { useDashboardData } from './useDashboardData'

/** Studio tool root: loads the client's report data and renders the two-pane dashboard. */
export function DmrDashboard() {
  const data = useDashboardData()
  const submitBudgetRequest = useSubmitBudgetRequest()

  return (
    <Card height="fill" className="dmr-root">
      <style>{dashboardCss}</style>
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
        <DashboardView settings={data.settings} months={data.months} isSample={data.isSample} submitBudgetRequest={submitBudgetRequest} />
      )}
    </Card>
  )
}
