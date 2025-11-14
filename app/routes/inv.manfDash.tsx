import { Page, Layout, Card, Tabs, Box } from "@shopify/polaris"
import { useState, useCallback } from "react"
import ManufacturingDashboard from "../components/manufacturing/manufacturing-dashboard"
import AssetUtilization from "../components/manufacturing/asset-utilization"

export default function ManufacturingRoute() {
  const [selected, setSelected] = useState(0)

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelected(selectedTabIndex)
  }, [])

  const tabs = [
    {
      id: 'asset-utilization',
      content: 'Asset Utilization',
      panelID: 'asset-utilization-panel',
    },
    {
      id: 'manufacturing-dashboard',
      content: 'Manufacturing Dashboard',
      panelID: 'manufacturing-dashboard-panel',
    },
  ]

  return (
    <Page
      fullWidth
      title="META VR Manufacturing"
      subtitle="Monitor manufacturing operations and asset utilization"
      backAction={{ content: 'Back to Control Tower', url: '/inv/control-tower' }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
              <Box padding="400">
                {selected === 0 && <AssetUtilization />}
                {selected === 1 && <ManufacturingDashboard />}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
