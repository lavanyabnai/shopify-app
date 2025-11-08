import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  TextField,
  Banner,
  Text,
  Icon,
  Popover,
  ActionList,
  Box,
  LegacyStack,
  Layout,
  Select,
  Modal,
  FormLayout,
  ButtonGroup,
  Spinner,
  EmptyState
} from '@shopify/polaris'
import {
  AlertTriangleIcon,
  InventoryIcon,
  EditIcon,
  ViewIcon,
  DeleteIcon,
  RefreshIcon
} from '@shopify/polaris-icons'
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from "@remix-run/react"
import type { LoaderFunctionArgs } from "@remix-run/node"

// Types based on Shopify Inventory Management
interface ShopifyInventoryItem {
  id: string
  sku: string
  title: string
  variantId: string
  locationId: string
  locationName: string
  available: number
  committed: number
  reserved: number
  damaged: number
  safetyStock: number
  qualityControl: number
  incoming: number
  onHand: number
  cost: number
  price: number
  status: 'active' | 'draft' | 'archived'
  lastUpdated: string
  reorderPoint: number
  reorderQuantity: number
  supplier: string
  category: string
  tags: string[]
}

interface InventoryAdjustment {
  itemId: string
  locationId: string
  state: 'available' | 'committed' | 'reserved' | 'damaged' | 'safety_stock' | 'quality_control'
  delta: number
  reason: string
  referenceDocument?: string
}

// Mock data representing Shopify inventory
const mockInventoryData: ShopifyInventoryItem[] = [
  {
    id: "gid://shopify/InventoryItem/1",
    sku: "VR-QUEST3-128GB",
    title: "Meta Quest 3 128GB",
    variantId: "gid://shopify/ProductVariant/1",
    locationId: "gid://shopify/Location/1",
    locationName: "Main Warehouse",
    available: 1250,
    committed: 150,
    reserved: 25,
    damaged: 5,
    safetyStock: 100,
    qualityControl: 10,
    incoming: 500,
    onHand: 1540,
    cost: 299.99,
    price: 499.99,
    status: 'active',
    lastUpdated: "2025-01-15T10:30:00Z",
    reorderPoint: 200,
    reorderQuantity: 1000,
    supplier: "Meta Technologies",
    category: "VR Headsets",
    tags: ["vr", "gaming", "meta"]
  },
  {
    id: "gid://shopify/InventoryItem/2",
    sku: "VR-QUEST3-512GB",
    title: "Meta Quest 3 512GB",
    variantId: "gid://shopify/ProductVariant/2",
    locationId: "gid://shopify/Location/1",
    locationName: "Main Warehouse",
    available: 890,
    committed: 200,
    reserved: 15,
    damaged: 2,
    safetyStock: 75,
    qualityControl: 8,
    incoming: 300,
    onHand: 1190,
    cost: 399.99,
    price: 649.99,
    status: 'active',
    lastUpdated: "2025-01-15T10:25:00Z",
    reorderPoint: 150,
    reorderQuantity: 800,
    supplier: "Meta Technologies",
    category: "VR Headsets",
    tags: ["vr", "gaming", "meta", "premium"]
  },
  {
    id: "gid://shopify/InventoryItem/3",
    sku: "VR-QUEST-PRO",
    title: "Meta Quest Pro",
    variantId: "gid://shopify/ProductVariant/3",
    locationId: "gid://shopify/Location/2",
    locationName: "Secondary Warehouse",
    available: 45,
    committed: 25,
    reserved: 5,
    damaged: 1,
    safetyStock: 20,
    qualityControl: 2,
    incoming: 100,
    onHand: 98,
    cost: 799.99,
    price: 999.99,
    status: 'active',
    lastUpdated: "2025-01-15T09:45:00Z",
    reorderPoint: 30,
    reorderQuantity: 200,
    supplier: "Meta Technologies",
    category: "VR Headsets",
    tags: ["vr", "professional", "meta", "premium"]
  },
  {
    id: "gid://shopify/InventoryItem/4",
    sku: "VR-ACCESSORY-STRAP",
    title: "Elite Strap with Battery",
    variantId: "gid://shopify/ProductVariant/4",
    locationId: "gid://shopify/Location/1",
    locationName: "Main Warehouse",
    available: 320,
    committed: 50,
    reserved: 10,
    damaged: 3,
    safetyStock: 50,
    qualityControl: 5,
    incoming: 200,
    onHand: 388,
    cost: 79.99,
    price: 129.99,
    status: 'active',
    lastUpdated: "2025-01-15T11:15:00Z",
    reorderPoint: 100,
    reorderQuantity: 500,
    supplier: "Meta Technologies",
    category: "Accessories",
    tags: ["accessory", "battery", "strap"]
  },
  {
    id: "gid://shopify/InventoryItem/5",
    sku: "VR-CONTROLLER-LEFT",
    title: "Left Touch Controller",
    variantId: "gid://shopify/ProductVariant/5",
    locationId: "gid://shopify/Location/1",
    locationName: "Main Warehouse",
    available: 180,
    committed: 30,
    reserved: 8,
    damaged: 2,
    safetyStock: 25,
    qualityControl: 3,
    incoming: 150,
    onHand: 248,
    cost: 49.99,
    price: 79.99,
    status: 'active',
    lastUpdated: "2025-01-15T10:50:00Z",
    reorderPoint: 50,
    reorderQuantity: 300,
    supplier: "Meta Technologies",
    category: "Accessories",
    tags: ["controller", "replacement", "touch"]
  }
]

// Loader function for Remix
export const loader = async ({ params }: LoaderFunctionArgs) => {
  return {
    inventoryData: mockInventoryData,
    workspaceId: params.workspaceId
  }
}

function getInventoryStatusBadge(available: number, reorderPoint: number, committed: number) {
  const totalNeeded = reorderPoint + committed
  if (available <= 0) {
    return <Badge tone="critical">Out of Stock</Badge>
  } else if (available < reorderPoint) {
    return <Badge tone="warning">Low Stock</Badge>
  } else if (available < totalNeeded) {
    return <Badge tone="attention">Reorder Soon</Badge>
  } else {
    return <Badge tone="success">In Stock</Badge>
  }
}

function getInventoryStateBreakdown(item: ShopifyInventoryItem) {
  return (
    <LegacyStack vertical spacing="extraTight">
      <LegacyStack spacing="tight">
        <Text variant="bodySm" tone="subdued" as="span">Available:</Text>
        <Text variant="bodySm" fontWeight="medium" as="span">{item.available}</Text>
      </LegacyStack>
      <LegacyStack spacing="tight">
        <Text variant="bodySm" tone="subdued" as="span">Committed:</Text>
        <Text variant="bodySm" as="span">{item.committed}</Text>
      </LegacyStack>
      <LegacyStack spacing="tight">
        <Text variant="bodySm" tone="subdued" as="span">Reserved:</Text>
        <Text variant="bodySm" as="span">{item.reserved}</Text>
      </LegacyStack>
      {item.damaged > 0 && (
        <LegacyStack spacing="tight">
          <Text variant="bodySm" tone="critical" as="span">Damaged:</Text>
          <Text variant="bodySm" tone="critical" as="span">{item.damaged}</Text>
        </LegacyStack>
      )}
    </LegacyStack>
  )
}

export default function ShopifyInventoryTable() {
  const params = useParams()
  const navigate = useNavigate()
  const workspaceId = params.workspaceId as string
  
  const [searchValue, setSearchValue] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [popoverActive, setPopoverActive] = useState<{[key: number]: boolean}>({})
  const [adjustmentModalActive, setAdjustmentModalActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShopifyInventoryItem | null>(null)
  const [adjustmentForm, setAdjustmentForm] = useState<InventoryAdjustment>({
    itemId: '',
    locationId: '',
    state: 'available',
    delta: 0,
    reason: '',
    referenceDocument: ''
  })
  const [loading, setLoading] = useState(false)
  
  // Filter data based on search and filters
  const filteredData = mockInventoryData.filter(item => {
    const matchesSearch = 
      item.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.category.toLowerCase().includes(searchValue.toLowerCase())
    
    const matchesLocation = locationFilter === 'all' || item.locationName === locationFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesLocation && matchesStatus
  })
  
  const lowStockItems = filteredData.filter(item => item.available < item.reorderPoint).length
  const outOfStockItems = filteredData.filter(item => item.available <= 0).length
  const totalValue = filteredData.reduce((sum, item) => sum + (item.onHand * item.cost), 0)

  const handleSearchChange = useCallback((value: string) => setSearchValue(value), [])
  const handleLocationFilterChange = useCallback((value: string) => setLocationFilter(value), [])
  const handleStatusFilterChange = useCallback((value: string) => setStatusFilter(value), [])

  const togglePopover = useCallback((index: number) => {
    setPopoverActive(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }, [])

  const handleAdjustmentModalOpen = useCallback((item: ShopifyInventoryItem) => {
    setSelectedItem(item)
    setAdjustmentForm({
      itemId: item.id,
      locationId: item.locationId,
      state: 'available',
      delta: 0,
      reason: '',
      referenceDocument: ''
    })
    setAdjustmentModalActive(true)
  }, [])

  const handleAdjustmentModalClose = useCallback(() => {
    setAdjustmentModalActive(false)
    setSelectedItem(null)
    setAdjustmentForm({
      itemId: '',
      locationId: '',
      state: 'available',
      delta: 0,
      reason: '',
      referenceDocument: ''
    })
  }, [])

  const handleAdjustmentSubmit = useCallback(async () => {
    if (!selectedItem || !adjustmentForm.reason) return
    
    setLoading(true)
    try {
      // Here you would make the actual GraphQL mutation
      // await adjustInventoryQuantities(adjustmentForm)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Inventory adjustment submitted:', adjustmentForm)
      handleAdjustmentModalClose()
      
      // Show success message
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to adjust inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedItem, adjustmentForm, handleAdjustmentModalClose])

  const handleAction = useCallback((action: string, item: ShopifyInventoryItem) => {
    console.log(`Action: ${action} for item:`, item.sku)
    switch (action) {
      case 'view':
        navigate(`/workspaces/${workspaceId}/inventory/${item.id}`)
        break
      case 'adjust':
        handleAdjustmentModalOpen(item)
        break
      case 'edit':
        navigate(`/workspaces/${workspaceId}/inventory/${item.id}/edit`)
        break
      case 'history':
        navigate(`/workspaces/${workspaceId}/inventory/${item.id}/history`)
        break
      default:
        break
    }
  }, [navigate, workspaceId, handleAdjustmentModalOpen])

  const rows = filteredData.map((item, index) => [
    <LegacyStack vertical spacing="extraTight" key={`product-${index}`}>
      <Text variant="bodyMd" fontWeight="semibold" as="span">
        {item.title}
      </Text>
      <Box
        background="bg-surface-secondary"
        padding="100"
        borderRadius="100"
        as="span"
      >
        <Text variant="bodySm" fontWeight="medium" as="span" tone="subdued">
          {item.sku}
        </Text>
      </Box>
    </LegacyStack>,
    
    <Text variant="bodyMd" as="span">{item.locationName}</Text>,
    
    getInventoryStateBreakdown(item),
    
    <Text variant="bodyMd" fontWeight="medium" as="span">
      {item.onHand.toLocaleString()}
    </Text>,
    
    getInventoryStatusBadge(item.available, item.reorderPoint, item.committed),
    
    <LegacyStack vertical spacing="extraTight">
      <Text variant="bodySm" as="span">Reorder: {item.reorderPoint}</Text>
      <Text variant="bodySm" as="span">Qty: {item.reorderQuantity}</Text>
    </LegacyStack>,
    
    <Text variant="bodyMd" as="span">{item.supplier}</Text>,
    
    <Text variant="bodyMd" as="span">{item.category}</Text>,
    
    <Text variant="bodyMd" as="span">${item.cost.toFixed(2)}</Text>,
    
    <Text variant="bodySm" as="span">
      {new Date(item.lastUpdated).toLocaleDateString()}
    </Text>,
    
    <Popover
      active={popoverActive[index]}
      activator={
        <Button
          variant="tertiary"
          icon="horizontalDots"
          onClick={() => togglePopover(index)}
        />
      }
      onClose={() => togglePopover(index)}
    >
      <ActionList
        items={[
          { 
            content: 'View Details', 
            icon: ViewIcon,
            onAction: () => {
              handleAction('view', item)
              setPopoverActive(prev => ({ ...prev, [index]: false }))
            }
          },
          { 
            content: 'Adjust Inventory', 
            icon: EditIcon,
            onAction: () => {
              handleAction('adjust', item)
              setPopoverActive(prev => ({ ...prev, [index]: false }))
            }
          },
          { 
            content: 'Edit Product', 
            icon: EditIcon,
            onAction: () => {
              handleAction('edit', item)
              setPopoverActive(prev => ({ ...prev, [index]: false }))
            }
          },
          { 
            content: 'View History', 
            icon: ViewIcon,
            onAction: () => {
              handleAction('history', item)
              setPopoverActive(prev => ({ ...prev, [index]: false }))
            }
          },
        ]}
      />
    </Popover>
  ])

  const columnHeadings = [
    'Product',
    'Location',
    'Inventory States',
    'On Hand',
    'Status',
    'Reorder Info',
    'Supplier',
    'Category',
    'Cost',
    'Last Updated',
    ''
  ]

  const locationOptions = [
    { label: 'All Locations', value: 'all' },
    { label: 'Main Warehouse', value: 'Main Warehouse' },
    { label: 'Secondary Warehouse', value: 'Secondary Warehouse' }
  ]

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' }
  ]

  const inventoryStateOptions = [
    { label: 'Available', value: 'available' },
    { label: 'Committed', value: 'committed' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'Damaged', value: 'damaged' },
    { label: 'Safety Stock', value: 'safety_stock' },
    { label: 'Quality Control', value: 'quality_control' }
  ]

  return (
    <Page
      title="Shopify Inventory Management"
      subtitle="Manage inventory levels, states, and adjustments across all locations"
      primaryAction={{
        content: `Total Value: $${totalValue.toLocaleString()}`,
        disabled: true
      }}
      secondaryActions={[
        {
          content: 'Refresh',
          icon: RefreshIcon,
          onAction: () => window.location.reload()
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          {/* Alert Banner */}
          {(outOfStockItems > 0 || lowStockItems > 0) && (
            <Banner
              title="Inventory Alerts"
              tone={outOfStockItems > 0 ? "critical" : "warning"}
              icon={AlertTriangleIcon}
            >
              <LegacyStack spacing="loose">
                {outOfStockItems > 0 && (
                  <LegacyStack spacing="tight">
                    <Text variant="bodyMd" as="span">Out of Stock:</Text>
                    <Badge tone="critical">{outOfStockItems.toString()}</Badge>
                  </LegacyStack>
                )}
                {lowStockItems > 0 && (
                  <LegacyStack spacing="tight">
                    <Text variant="bodyMd" as="span">Low Stock:</Text>
                    <Badge tone="warning">{lowStockItems.toString()}</Badge>
                  </LegacyStack>
                )}
              </LegacyStack>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          {/* Filters */}
          <Card>
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Search by SKU, title, or category..."
                  prefix={<Icon source="search" />}
                  clearButton
                  onClearButtonClick={() => setSearchValue('')}
                  autoComplete="off"
                  label="Search"
                />
                <Select
                  label="Location"
                  options={locationOptions}
                  value={locationFilter}
                  onChange={handleLocationFilterChange}
                />
                <Select
                  label="Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                />
              </FormLayout.Group>
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section>
          {/* Data Table */}
          <Card>
            {filteredData.length === 0 ? (
              <EmptyState
                heading="No inventory items found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                action={{
                  content: 'Add inventory item',
                  onAction: () => navigate(`/workspaces/${workspaceId}/inventory/new`)
                }}
              >
                <p>Try adjusting your search or filter criteria.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={[
                  'text',
                  'text',
                  'text',
                  'numeric',
                  'text',
                  'text',
                  'text',
                  'text',
                  'numeric',
                  'text',
                  'text'
                ]}
                headings={columnHeadings}
                rows={rows}
                hoverable
              />
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          {/* Results count */}
          {searchValue && (
            <Text variant="bodySm" tone="subdued" as="span">
              Showing {filteredData.length} of {mockInventoryData.length} results
            </Text>
          )}
        </Layout.Section>
      </Layout>

      {/* Inventory Adjustment Modal */}
      <Modal
        open={adjustmentModalActive}
        onClose={handleAdjustmentModalClose}
        title="Adjust Inventory"
        primaryAction={{
          content: 'Adjust Inventory',
          onAction: handleAdjustmentSubmit,
          loading: loading,
          disabled: !adjustmentForm.reason || adjustmentForm.delta === 0
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleAdjustmentModalClose
          }
        ]}
      >
        <Modal.Section>
          {selectedItem && (
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  label="Product"
                  value={selectedItem.title}
                  disabled
                  autoComplete="off"
                />
                <TextField
                  label="SKU"
                  value={selectedItem.sku}
                  disabled
                  autoComplete="off"
                />
              </FormLayout.Group>
              
              <FormLayout.Group>
                <TextField
                  label="Location"
                  value={selectedItem.locationName}
                  disabled
                  autoComplete="off"
                />
                <Select
                  label="Inventory State"
                  options={inventoryStateOptions}
                  value={adjustmentForm.state}
                  onChange={(value) => setAdjustmentForm(prev => ({ ...prev, state: value as any }))}
                />
              </FormLayout.Group>
              
              <TextField
                label="Adjustment Amount"
                type="number"
                value={adjustmentForm.delta.toString()}
                onChange={(value) => setAdjustmentForm(prev => ({ ...prev, delta: parseInt(value) || 0 }))}
                helpText="Positive number to increase, negative to decrease"
                autoComplete="off"
              />
              
              <TextField
                label="Reason for Adjustment"
                value={adjustmentForm.reason}
                onChange={(value) => setAdjustmentForm(prev => ({ ...prev, reason: value }))}
                multiline={3}
                helpText="Required: Explain why this adjustment is being made"
                autoComplete="off"
              />
              
              <TextField
                label="Reference Document (Optional)"
                value={adjustmentForm.referenceDocument}
                onChange={(value) => setAdjustmentForm(prev => ({ ...prev, referenceDocument: value }))}
                helpText="PO number, invoice, or other reference"
                autoComplete="off"
              />
            </FormLayout>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  )
}
