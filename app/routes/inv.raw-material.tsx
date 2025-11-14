import { useState, useCallback } from "react"
import { Page, Tabs } from "@shopify/polaris"
import { useNavigate } from "@remix-run/react"
import RMCoverageTable from "../components/controlKpi/rm-coverage-table"
import RMAlertsDashboard from "../components/controlKpi/rm-alerts-dashboard"

export default function RawMaterialPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(0)

  const handleTabChange = useCallback((selectedTabIndex: number) => setSelected(selectedTabIndex), [])

  const tabs = [
    {
      id: "rm-coverage",
      content: "RM Coverage",
      panelID: "rm-coverage-panel",
    },
    {
      id: "rm-alerts",
      content: "RM Alerts",
      panelID: "rm-alerts-panel",
    },
  ]

  return (
    <Page
      fullWidth
      title="Raw Material Management"
      backAction={{
        content: "Control Tower",
        onAction: () => navigate("/inv/control-tower"),
      }}
    >
      <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
        {selected === 0 && <RMCoverageTable />}
        {selected === 1 && <RMAlertsDashboard />}
      </Tabs>
    </Page>
  )
}
