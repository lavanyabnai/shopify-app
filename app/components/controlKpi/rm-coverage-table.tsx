import { Card, Text, BlockStack, Box, DataTable, InlineStack, Badge } from "@shopify/polaris"

interface SupplyChainRow {
  type: "Demand" | "Firm Supply" | "Inventory" | "Balance"
  past: number
  weeks: number[]
}

interface SupplyChainData {
  part: string
  site: string
  date: string
  responsible: string
  rows: SupplyChainRow[]
}

const supplyChainData: SupplyChainData[] = [
  {
    part: "S1001",
    site: "E3001",
    date: "06-08-17",
    responsible: "Master Administrator",
    rows: [
      {
        type: "Demand",
        past: 0,
        weeks: [31739, 25000, 25000, 25000, 25000, 25000, 0, 25000, 0, 25000, 0],
      },
      {
        type: "Firm Supply",
        past: 95,
        weeks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Inventory",
        past: 95,
        weeks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Balance",
        past: 95,
        weeks: [-31644, -56644, -81644, -106644, -131644, -156644, -156644, -181644, -181644, -206644, -206644],
      },
    ],
  },
  {
    part: "E3003",
    site: "",
    date: "06-21-17",
    responsible: "Master Administrator",
    rows: [
      {
        type: "Demand",
        past: 0,
        weeks: [76772, 75000, 25000, 50000, 0, 25000, 25000, 25000, 25000, 25000, 25000],
      },
      {
        type: "Firm Supply",
        past: 0,
        weeks: [0, 36265, 46436, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Inventory",
        past: 82000,
        weeks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Balance",
        past: 82000,
        weeks: [5228, -33507, -6071, -56071, -56071, -81071, -106071, -131071, -156071, -181071, -206071],
      },
    ],
  },
  {
    part: "P1001",
    site: "",
    date: "06-07-17",
    responsible: "Master Administrator",
    rows: [
      {
        type: "Demand",
        past: 0,
        weeks: [63813, 25000, 0, 25000, 25000, 25000, 25000, 0, 25000, 0, 25000],
      },
      {
        type: "Firm Supply",
        past: 0,
        weeks: [31979, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Inventory",
        past: 95,
        weeks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Balance",
        past: 95,
        weeks: [-31739, -56739, -56739, -81739, -106739, -131739, -156739, -156739, -181739, -181739, -206739],
      },
    ],
  },
  {
    part: "P2001",
    site: "",
    date: "06-07-17",
    responsible: "Master Administrator",
    rows: [
      {
        type: "Demand",
        past: 0,
        weeks: [74903, 75000, 50000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000],
      },
      {
        type: "Firm Supply",
        past: 0,
        weeks: [29036, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Inventory",
        past: 95,
        weeks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Balance",
        past: 95,
        weeks: [-45772, -120772, -170772, -195772, -220772, -245772, -270772, -295772, -320772, -345772, -370772],
      },
    ],
  },
  {
    part: "B1010",
    site: "E3001",
    date: "06-26-17",
    responsible: "Master Administrator",
    rows: [
      {
        type: "Demand",
        past: 0,
        weeks: [56644, 0, 25000, 25000, 25000, 25000, 0, 25000, 0, 25000, 0],
      },
      {
        type: "Firm Supply",
        past: 0,
        weeks: [101797, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Inventory",
        past: 2930,
        weeks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        type: "Balance",
        past: 2930,
        weeks: [48083, 48083, 23083, -1917, -26917, -51917, -51917, -76917, -76917, -101917, -101917],
      },
    ],
  },
]

const dateHeaders = [
  "06-05-17",
  "06-12-17",
  "06-19-17",
  "06-26-17",
  "07-03-17",
  "07-10-17",
  "07-17-17",
  "07-24-17",
  "07-31-17",
  "08-07-17",
  "08-14-17",
]

const formatValue = (value: number): string => {
  if (value === 0) return "0"
  return value.toLocaleString()
}

const getCellStyle = (type: string, value: number): React.CSSProperties => {
  if (type === "Balance" && value < 0) {
    return { color: "#D82C0D", fontWeight: 600 }
  }
  return {}
}

export default function RMCoverageTable() {
  // Flatten data for DataTable
  const rows: any[][] = []

  supplyChainData.forEach((item, itemIndex) => {
    item.rows.forEach((row, rowIndex) => {
      const rowData: any[] = []

      // Add item info only for first row
      if (rowIndex === 0) {
        rowData.push(itemIndex + 1) // #
        rowData.push(item.part) // Part
        rowData.push(item.site) // Site
        rowData.push(item.date) // Date
        rowData.push(item.responsible) // Responsible
      } else {
        rowData.push("", "", "", "", "") // Empty cells for grouped rows
      }

      // Add row type
      rowData.push(
        <Box
          background={row.type === "Balance" ? "bg-surface-warning" : "bg-surface-secondary"}
          padding="100"
          borderRadius="100"
        >
          <Text as="span" variant="bodySm" fontWeight="semibold">
            {row.type}
          </Text>
        </Box>
      )

      // Add past value
      rowData.push(
        <span style={getCellStyle(row.type, row.past)}>
          <Text as="span" variant="bodySm" fontWeight={row.type === "Balance" && row.past < 0 ? "bold" : "regular"}>
            {formatValue(row.past)}
          </Text>
        </span>
      )

      // Add week values
      row.weeks.forEach((weekValue) => {
        rowData.push(
          <span style={getCellStyle(row.type, weekValue)}>
            <Text as="span" variant="bodySm" fontWeight={row.type === "Balance" && weekValue < 0 ? "bold" : "regular"}>
              {formatValue(weekValue)}
            </Text>
          </span>
        )
      })

      rows.push(rowData)
    })
  })

  const columnHeadings = ["#", "Part", "Site", "Date", "Responsible", "Type", "Past", ...dateHeaders]

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Raw Material Coverage
          </Text>
          <Box>
            <div style={{ overflowX: "auto" }}>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "numeric",
                  ...dateHeaders.map(() => "numeric" as const),
                ]}
                headings={columnHeadings}
                rows={rows}
                hoverable
                verticalAlign="middle"
              />
            </div>
          </Box>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Supply Chain Planning Legend
          </Text>

          <InlineStack gap="800" wrap>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" fontWeight="semibold">
                  Row Types:
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">
                    <Text as="span" fontWeight="semibold">
                      Demand:
                    </Text>{" "}
                    Forecasted or planned demand for the period
                  </Text>
                  <Text as="p" variant="bodySm">
                    <Text as="span" fontWeight="semibold">
                      Firm Supply:
                    </Text>{" "}
                    Confirmed supply/production orders
                  </Text>
                  <Text as="p" variant="bodySm">
                    <Text as="span" fontWeight="semibold">
                      Inventory:
                    </Text>{" "}
                    Current inventory levels
                  </Text>
                  <Text as="p" variant="bodySm">
                    <Text as="span" fontWeight="semibold">
                      Balance:
                    </Text>{" "}
                    Calculated available inventory (negative = shortage)
                  </Text>
                </BlockStack>
              </BlockStack>
            </div>

            <div style={{ flex: 1, minWidth: "250px" }}>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" fontWeight="semibold">
                  Color Coding:
                </Text>
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="info">Part numbers</Badge>
                    <Text as="span" variant="bodySm">
                      - Highlighted in blue
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="warning">Row types</Badge>
                    <Text as="span" variant="bodySm">
                      - Yellow background
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" tone="critical" fontWeight="bold">
                      Red text
                    </Text>
                    <Text as="span" variant="bodySm">
                      - Negative balance (shortage)
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </div>
          </InlineStack>
        </BlockStack>
      </Card>
    </BlockStack>
  )
}
