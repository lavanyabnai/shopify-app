import { Page, Layout, Card, Tabs, Box } from "@shopify/polaris"
import { useState, useCallback } from "react"
import MetaVRFinishedGoodsTable from "../components/controlKpi/meta-vr-finished-goods-table"
import MetaVRAgingDashboard from "../components/controlKpi/meta-vr-aging-dashboard"
import InvProj from "../components/supplychain/Invproj"

export default function RawMaterial() {
  const [selected, setSelected] = useState(0)

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelected(selectedTabIndex)
  }, [])

  const tabs = [
    {
      id: 'inv-projection',
      content: 'Inventory Projection',
      panelID: 'inv-projection-panel',
    },
    {
      id: 'finished-goods',
      content: 'Finished Goods',
      panelID: 'finished-goods-panel',
    },
    {
      id: 'aging-dashboard',
      content: 'Aging Dashboard',
      panelID: 'aging-dashboard-panel',
    },
  ]

  return (
    <Page
      fullWidth
      title="Inventory Management"
      subtitle="Comprehensive view of inventory projection, finished goods, and aging analysis"
      backAction={{ content: 'Control Tower', url: '/inv/control-tower' }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
              <Box padding="400">
                {selected === 0 && <InvProj />}
                {selected === 1 && <MetaVRFinishedGoodsTable />}
                {selected === 2 && <MetaVRAgingDashboard />}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}