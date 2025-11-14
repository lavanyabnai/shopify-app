import { useState, useCallback } from "react"
import {
  Card,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  Box,
  ProgressBar,
  Banner,
  TextField,
  ChoiceList,
  Filters,
} from "@shopify/polaris"
import {
  ChartVerticalIcon,
  AlertTriangleIcon,
} from "@shopify/polaris-icons"

interface CapacityData {
  constraint: string
  site: string
  totalCapacity: number
  loadedCapacity: number
  availableCapacity: number
  utilizationPercent: number
  overUnderLoad: number
  status: "critical" | "warning" | "success" | "info"
}

export default function AssetUtilization() {
  const [selectedConstraint, setSelectedConstraint] = useState<string[]>([])
  const [selectedSite, setSelectedSite] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState("")

  // Capacity Planning Data
  const capacityData: CapacityData[] = [
    {
      constraint: "Assembly Line 1",
      site: "Austin, TX",
      totalCapacity: 2400,
      loadedCapacity: 2280,
      availableCapacity: 120,
      utilizationPercent: 95,
      overUnderLoad: -120,
      status: "critical",
    },
    {
      constraint: "Assembly Line 2",
      site: "Austin, TX",
      totalCapacity: 2400,
      loadedCapacity: 2088,
      availableCapacity: 312,
      utilizationPercent: 87,
      overUnderLoad: 312,
      status: "warning",
    },
    {
      constraint: "Testing Station A",
      site: "Fremont, CA",
      totalCapacity: 1600,
      loadedCapacity: 1152,
      availableCapacity: 448,
      utilizationPercent: 72,
      overUnderLoad: 448,
      status: "success",
    },
    {
      constraint: "Testing Station B",
      site: "Fremont, CA",
      totalCapacity: 1600,
      loadedCapacity: 1040,
      availableCapacity: 560,
      utilizationPercent: 65,
      overUnderLoad: 560,
      status: "success",
    },
    {
      constraint: "Packaging Unit 1",
      site: "Reno, NV",
      totalCapacity: 3200,
      loadedCapacity: 2080,
      availableCapacity: 1120,
      utilizationPercent: 65,
      overUnderLoad: 1120,
      status: "success",
    },
    {
      constraint: "Packaging Unit 2",
      site: "Reno, NV",
      totalCapacity: 3200,
      loadedCapacity: 1856,
      availableCapacity: 1344,
      utilizationPercent: 58,
      overUnderLoad: 1344,
      status: "info",
    },
    {
      constraint: "Quality Control",
      site: "Phoenix, AZ",
      totalCapacity: 2000,
      loadedCapacity: 1160,
      availableCapacity: 840,
      utilizationPercent: 58,
      overUnderLoad: 840,
      status: "info",
    },
    {
      constraint: "Final Assembly",
      site: "Phoenix, AZ",
      totalCapacity: 2800,
      loadedCapacity: 2240,
      availableCapacity: 560,
      utilizationPercent: 80,
      overUnderLoad: 560,
      status: "warning",
    },
    {
      constraint: "Shipping Dock A",
      site: "Austin, TX",
      totalCapacity: 4000,
      loadedCapacity: 2400,
      availableCapacity: 1600,
      utilizationPercent: 60,
      overUnderLoad: 1600,
      status: "success",
    },
    {
      constraint: "Receiving Dock",
      site: "Fremont, CA",
      totalCapacity: 3500,
      loadedCapacity: 2450,
      availableCapacity: 1050,
      utilizationPercent: 70,
      overUnderLoad: 1050,
      status: "success",
    },
  ]

  // Filter options
  const constraintOptions = Array.from(new Set(capacityData.map((item) => item.constraint)))
  const siteOptions = Array.from(new Set(capacityData.map((item) => item.site)))

  // Apply filters
  const filteredData = capacityData.filter((item) => {
    const matchesConstraint = selectedConstraint.length === 0 || selectedConstraint.includes(item.constraint)
    const matchesSite = selectedSite.length === 0 || selectedSite.includes(item.site)
    const matchesSearch =
      searchValue === "" ||
      item.constraint.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.site.toLowerCase().includes(searchValue.toLowerCase())
    return matchesConstraint && matchesSite && matchesSearch
  })

  // Calculate summary metrics
  const totalCapacity = filteredData.reduce((sum, item) => sum + item.totalCapacity, 0)
  const totalLoaded = filteredData.reduce((sum, item) => sum + item.loadedCapacity, 0)
  const totalAvailable = filteredData.reduce((sum, item) => sum + item.availableCapacity, 0)
  const avgUtilization = filteredData.length > 0
    ? Math.round(filteredData.reduce((sum, item) => sum + item.utilizationPercent, 0) / filteredData.length)
    : 0

  const criticalAssets = filteredData.filter((item) => item.utilizationPercent >= 90).length
  const warningAssets = filteredData.filter((item) => item.utilizationPercent >= 80 && item.utilizationPercent < 90).length

  const handleConstraintChange = useCallback((value: string[]) => {
    setSelectedConstraint(value)
  }, [])

  const handleSiteChange = useCallback((value: string[]) => {
    setSelectedSite(value)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedConstraint([])
    setSelectedSite([])
    setSearchValue("")
  }, [])

  const filters = [
    {
      key: "constraint",
      label: "Constraint",
      filter: (
        <ChoiceList
          title="Constraint"
          titleHidden
          choices={constraintOptions.map((option) => ({ label: option, value: option }))}
          selected={selectedConstraint}
          onChange={handleConstraintChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "site",
      label: "Site",
      filter: (
        <ChoiceList
          title="Site"
          titleHidden
          choices={siteOptions.map((option) => ({ label: option, value: option }))}
          selected={selectedSite}
          onChange={handleSiteChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ]

  const appliedFilters = []
  if (selectedConstraint.length > 0) {
    appliedFilters.push({
      key: "constraint",
      label: `Constraint: ${selectedConstraint.join(", ")}`,
      onRemove: () => setSelectedConstraint([]),
    })
  }
  if (selectedSite.length > 0) {
    appliedFilters.push({
      key: "site",
      label: `Site: ${selectedSite.join(", ")}`,
      onRemove: () => setSelectedSite([]),
    })
  }

  // Utilization summary for chart
  const utilizationBuckets = [
    {
      range: "90-100%",
      count: filteredData.filter((item) => item.utilizationPercent >= 90).length,
      tone: "critical" as const,
    },
    {
      range: "80-89%",
      count: filteredData.filter((item) => item.utilizationPercent >= 80 && item.utilizationPercent < 90).length,
      tone: "warning" as const,
    },
    {
      range: "70-79%",
      count: filteredData.filter((item) => item.utilizationPercent >= 70 && item.utilizationPercent < 80).length,
      tone: "success" as const,
    },
    {
      range: "60-69%",
      count: filteredData.filter((item) => item.utilizationPercent >= 60 && item.utilizationPercent < 70).length,
      tone: "info" as const,
    },
    {
      range: "<60%",
      count: filteredData.filter((item) => item.utilizationPercent < 60).length,
      tone: "info" as const,
    },
  ]

  const maxCount = Math.max(...utilizationBuckets.map((b) => b.count))

  return (
    <BlockStack gap="400">
      <Text variant="headingLg" as="h2">
        Asset Utilization & Capacity Planning
      </Text>

      {/* Summary Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <Card>
          <BlockStack gap="200">
            <Text variant="bodySm" tone="subdued" as="p">
              Average Utilization
            </Text>
            <Text variant="heading2xl" as="h4" fontWeight="bold">
              {avgUtilization}%
            </Text>
            <Badge tone={avgUtilization >= 85 ? "warning" : "success"}>
              {filteredData.length} assets
            </Badge>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text variant="bodySm" tone="subdued" as="p">
              Total Capacity (hrs)
            </Text>
            <Text variant="heading2xl" as="h4" fontWeight="bold">
              {totalCapacity.toLocaleString()}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              Across all facilities
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text variant="bodySm" tone="subdued" as="p">
              Loaded Capacity (hrs)
            </Text>
            <Text variant="heading2xl" as="h4" fontWeight="bold">
              {totalLoaded.toLocaleString()}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              {Math.round((totalLoaded / totalCapacity) * 100)}% of total
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text variant="bodySm" tone="subdued" as="p">
              Available Capacity (hrs)
            </Text>
            <Text variant="heading2xl" as="h4" fontWeight="bold">
              {totalAvailable.toLocaleString()}
            </Text>
            <Badge tone={totalAvailable < 1000 ? "warning" : "success"}>
              {Math.round((totalAvailable / totalCapacity) * 100)}% available
            </Badge>
          </BlockStack>
        </Card>
      </div>

      {/* Alert Banner */}
      {(criticalAssets > 0 || warningAssets > 0) && (
        <Banner
          title={`${criticalAssets} critical and ${warningAssets} warning capacity alerts`}
          tone={criticalAssets > 0 ? "critical" : "warning"}
          icon={AlertTriangleIcon}
        >
          <Text as="p" variant="bodySm">
            {criticalAssets > 0
              ? `${criticalAssets} assets operating at >90% capacity. Consider load balancing or additional capacity.`
              : `${warningAssets} assets operating at 80-90% capacity. Monitor closely for potential constraints.`}
          </Text>
        </Banner>
      )}

      {/* Filters */}
      <Card>
        <BlockStack gap="400">
          <Filters
            queryValue={searchValue}
            filters={filters}
            appliedFilters={appliedFilters}
            onQueryChange={handleSearchChange}
            onQueryClear={() => setSearchValue("")}
            onClearAll={handleClearAll}
          />
        </BlockStack>
      </Card>

      {/* Capacity Planning Table */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <div style={{ width: "16px", height: "16px" }}>
                <ChartVerticalIcon />
              </div>
              <Text variant="headingMd" as="h3">
                Capacity Planning Details
              </Text>
            </InlineStack>
            <Text variant="bodySm" tone="subdued" as="span">
              {filteredData.length} assets shown
            </Text>
          </InlineStack>

          <BlockStack gap="400">
            {filteredData.map((item, index) => (
              <Box key={index} padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300">
                  {/* Header */}
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold" as="p">
                        {item.constraint}
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        {item.site}
                      </Text>
                    </BlockStack>
                    <Badge tone={item.status}>{item.utilizationPercent}% utilized</Badge>
                  </InlineStack>

                  {/* Utilization Bar */}
                  <ProgressBar
                    progress={item.utilizationPercent}
                    size="medium"
                    tone={
                      item.utilizationPercent >= 90
                        ? "critical"
                        : item.utilizationPercent >= 80
                        ? "warning"
                        : "success"
                    }
                  />

                  {/* Capacity Details */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Total Capacity
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold" as="span">
                        {item.totalCapacity.toLocaleString()} hrs
                      </Text>
                    </BlockStack>
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Loaded
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold" as="span">
                        {item.loadedCapacity.toLocaleString()} hrs
                      </Text>
                    </BlockStack>
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Available
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold" as="span">
                        {item.availableCapacity.toLocaleString()} hrs
                      </Text>
                    </BlockStack>
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Over/Under Load
                      </Text>
                      <Text
                        variant="bodyMd"
                        fontWeight="semibold"
                        tone={item.overUnderLoad < 0 ? "critical" : "success"}
                        as="span"
                      >
                        {item.overUnderLoad > 0 ? "+" : ""}
                        {item.overUnderLoad.toLocaleString()} hrs
                      </Text>
                    </BlockStack>
                  </div>
                </BlockStack>
              </Box>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Utilization Distribution Chart */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h3">
              Utilization Distribution
            </Text>
            <div style={{ width: "16px", height: "16px" }}>
              <ChartVerticalIcon />
            </div>
          </InlineStack>

          <BlockStack gap="300">
            {utilizationBuckets.map((bucket, index) => {
              const percentage = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0
              return (
                <BlockStack key={index} gap="100">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" fontWeight="medium" as="span">
                      {bucket.range}
                    </Text>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                      {bucket.count} assets
                    </Text>
                  </InlineStack>
                  <ProgressBar progress={percentage} size="medium" tone={bucket.tone} />
                </BlockStack>
              )
            })}
          </BlockStack>

          <Banner tone="info">
            <Text as="p" variant="bodySm">
              Distribution shows {filteredData.length} total assets across all utilization ranges.
              {criticalAssets > 0 && ` ${criticalAssets} assets require immediate attention.`}
            </Text>
          </Banner>
        </BlockStack>
      </Card>
    </BlockStack>
  )
}
