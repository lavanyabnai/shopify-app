import { Page, Layout, Card, Tabs, Box } from "@shopify/polaris"
import { useState, useCallback } from "react"
import MetaVRFinishedGoodsTable from "../components/controlKpi/meta-vr-finished-goods-table"
import MetaVRReturnsRMATable from "../components/controlKpi/meta-vr-returns-rma-table"

export default function CustomerReceipt() {
  const [selected, setSelected] = useState(0)

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelected(selectedTabIndex)
  }, [])

  const tabs = [
    {
      id: 'finished-goods',
      content: 'Finished Goods',
      panelID: 'finished-goods-panel',
    },
    {
      id: 'returns-rma',
      content: 'Returns/RMA',
      panelID: 'returns-rma-panel',
    },
  ]

  return (
    <Page
      fullWidth
      title="Customer Receipt Management"
      subtitle="Manage finished goods inventory and returns/RMA processing"
      backAction={{ content: 'Back to Control Tower', url: '/inv/control-tower' }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
              <Box padding="400">
                {selected === 0 && <MetaVRFinishedGoodsTable />}
                {selected === 1 && <MetaVRReturnsRMATable />}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
