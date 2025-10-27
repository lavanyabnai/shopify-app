import {
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Badge,
  Button,
  EmptyState,
  Spinner,
  Pagination,
  MenuGroupDescriptor,
  ActionListSection,
  ButtonGroup,
  Popover,
  ActionList,
  TextField,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
  RangeSlider,
  useBreakpoints,
} from '@shopify/polaris';
import type {IndexFiltersProps, TabProps} from '@shopify/polaris';
import React, { useState, useCallback, useMemo } from 'react';
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useNavigate, useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';

const ORDERS_QUERY = `
  query GetOrders {
    orders(first: 50, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        displayFinancialStatus
        displayFulfillmentStatus
      }
    }
  }
`;

// Helper functions
function disambiguateLabel(key: string, value: string | any[]): string {
  switch (key) {
    case 'orderTotal':
      return `Order total is between $${value[0]} and $${value[1]}`;
    case 'customerName':
      return `Customer name contains ${value}`;
    case 'paymentStatus':
      return (value as string[]).map((val) => `Payment ${val}`).join(', ');
    case 'fulfillmentStatus':
      return (value as string[]).map((val) => `Fulfillment ${val}`).join(', ');
    default:
      return value as string;
  }
}

function isEmpty(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  } else {
    return value === '' || value == null;
  }
}

export default function Orders() {
  const navigate = useNavigate();
  const { orders: ordersData } = useLoaderData<typeof loader>();
  const breakpoints = useBreakpoints();
  
  // State for sorting
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('descending');
  const [sortColumnIndex, setSortColumnIndex] = useState<number>(2); // Default sort by date
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Popover state for bulk actions
  const [bulkActionsPopoverActive, setBulkActionsPopoverActive] = useState(false);
  
  // IndexFilters state
  const [itemStrings, setItemStrings] = useState([
    'All',
    'Unpaid',
    'Open',
    'Closed',
    'Fulfilled',
    'Unfulfilled',
  ]);
  const [selected, setSelected] = useState(0);
  const { mode, setMode } = useSetIndexFiltersMode();
  
  
  // Filter states
  const [paymentStatus, setPaymentStatus] = useState<string[] | undefined>(undefined);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string[] | undefined>(undefined);
  const [orderTotal, setOrderTotal] = useState<[number, number] | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [queryValue, setQueryValue] = useState('');
  
  // Sort options
  const [sortSelected, setSortSelected] = useState(['date desc']);
  
  // Filter handlers
  const handlePaymentStatusChange = useCallback(
    (value: string[]) => setPaymentStatus(value),
    [],
  );
  const handleFulfillmentStatusChange = useCallback(
    (value: string[]) => setFulfillmentStatus(value),
    [],
  );
  const handleOrderTotalChange = useCallback(
    (value: [number, number]) => setOrderTotal(value),
    [],
  );
  const handleCustomerNameChange = useCallback(
    (value: string) => setCustomerName(value),
    [],
  );
  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );
  const handlePaymentStatusRemove = useCallback(
    () => setPaymentStatus(undefined),
    [],
  );
  const handleFulfillmentStatusRemove = useCallback(
    () => setFulfillmentStatus(undefined),
    [],
  );
  const handleOrderTotalRemove = useCallback(
    () => setOrderTotal(undefined),
    [],
  );
  const handleCustomerNameRemove = useCallback(() => setCustomerName(''), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
  const handleFiltersClearAll = useCallback(() => {
    handlePaymentStatusRemove();
    handleFulfillmentStatusRemove();
    handleOrderTotalRemove();
    handleCustomerNameRemove();
    handleQueryValueRemove();
  }, [
    handlePaymentStatusRemove,
    handleFulfillmentStatusRemove,
    handleOrderTotalRemove,
    handleCustomerNameRemove,
    handleQueryValueRemove,
  ]);
  
  // Transform the GraphQL data to match our table structure
  const orders = ordersData.data.orders.nodes.map((order: any) => {
    const customerName = 'Guest'; // Customer data is protected, so we'll show Guest for all orders
    
    const total = order.totalPriceSet?.shopMoney 
      ? `${order.totalPriceSet.shopMoney.currencyCode} ${order.totalPriceSet.shopMoney.amount}`
      : 'N/A';
    
    const date = new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Extract order number from the full ID for display
    const orderNumber = order.id.split('/').pop();
    
    return {
      id: order.id, // Use full ID for navigation
      orderNumber: orderNumber, // Keep order number for display
      order: order.name,
      date: date,
      customer: customerName,
      channel: 'Online Store', // Default channel
      total: total,
      paymentStatus: (
        <Badge
          progress={
            order.displayFinancialStatus === 'PAID' ? 'complete' :
            order.displayFinancialStatus === 'PARTIALLY_PAID' ? 'partiallyComplete' :
            'incomplete'
          }
          tone={
            order.displayFinancialStatus === 'PAID' ? 'success' :
            order.displayFinancialStatus === 'PARTIALLY_PAID' ? 'info' :
            'critical'
          }
        >
          {order.displayFinancialStatus === 'PAID'
            ? 'Paid'
            : order.displayFinancialStatus === 'PARTIALLY_PAID'
              ? 'Partially Paid'
              : order.displayFinancialStatus
                ? order.displayFinancialStatus.replace('_', ' ')
                : 'Unknown'}
        </Badge>
      ),
      fulfillmentStatus: (
        <Badge 
          progress={
            order.displayFulfillmentStatus === 'FULFILLED' ? 'complete' : 
            order.displayFulfillmentStatus === 'COMPLETE' ? 'complete' : 
            'incomplete'
          }
          tone={
            order.displayFulfillmentStatus === 'FULFILLED' ? 'info' : 
            order.displayFulfillmentStatus === 'COMPLETE' ? 'success' : 
            'critical'
          }
        >
          {order.displayFulfillmentStatus?.replace('_', ' ') || 'Unknown'}
        </Badge>
      ),
      items: Math.floor(Math.random() * 15) + 1, // Mock item count
      deliveryStatus: (
        <Badge progress="incomplete" tone="critical">
          Pending
        </Badge>
      ),
      deliveryMethod: 'Standard shipping',
      tags: 'No tags applied',
    };
  });

  // Filtering and sorting logic
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];
    
    // Apply search query
    if (queryValue) {
      const searchLower = queryValue.toLowerCase();
      filtered = filtered.filter(order => 
        order.order.toLowerCase().includes(searchLower) ||
        order.customer.toLowerCase().includes(searchLower) ||
        order.total.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply payment status filter
    if (paymentStatus && paymentStatus.length > 0) {
      filtered = filtered.filter(order => {
        const status = order.paymentStatus.props.children;
        return paymentStatus.some(statusFilter => 
          status.toLowerCase().includes(statusFilter.toLowerCase())
        );
      });
    }
    
    // Apply fulfillment status filter
    if (fulfillmentStatus && fulfillmentStatus.length > 0) {
      filtered = filtered.filter(order => {
        const status = order.fulfillmentStatus.props.children;
        return fulfillmentStatus.some(statusFilter => 
          status.toLowerCase().includes(statusFilter.toLowerCase())
        );
      });
    }
    
    // Apply order total filter
    if (orderTotal) {
      filtered = filtered.filter(order => {
        const totalAmount = parseFloat(order.total.replace(/[^0-9.-]+/g, ''));
        return totalAmount >= orderTotal[0] && totalAmount <= orderTotal[1];
      });
    }
    
    // Apply customer name filter
    if (customerName) {
      filtered = filtered.filter(order => 
        order.customer.toLowerCase().includes(customerName.toLowerCase())
      );
    }
    
    // Apply sorting
    const [sortField, sortDir] = sortSelected[0].split(' ');
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'order':
          aVal = a.orderNumber;
          bVal = b.orderNumber;
          break;
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'customer':
          aVal = a.customer;
          bVal = b.customer;
          break;
        case 'total':
          aVal = parseFloat(a.total.replace(/[^0-9.-]+/g, ''));
          bVal = parseFloat(b.total.replace(/[^0-9.-]+/g, ''));
          break;
        default:
          return 0;
      }
      
      if (sortDir === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    return filtered;
  }, [orders, queryValue, paymentStatus, fulfillmentStatus, orderTotal, customerName, sortSelected]);
  
  // Sorting functionality
  const handleSort = useCallback((headingIndex: number, direction: 'ascending' | 'descending') => {
    setSortColumnIndex(headingIndex);
    setSortDirection(direction);
    
    // In a real app, you would make a new API call with the sort parameters
    console.log(`Sorting by column ${headingIndex} in ${direction} direction`);
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // View management
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const deleteView = (index: number) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name: string) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: 'rename',
              onAction: () => {},
              onPrimaryAction: async (value: string): Promise<boolean> => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: 'duplicate',
              onPrimaryAction: async (value: string): Promise<boolean> => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: 'edit',
            },
            {
              type: 'delete',
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));

  const onCreateNewView = async (value: string) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: 'Order', value: 'order asc', directionLabel: 'Ascending'},
    {label: 'Order', value: 'order desc', directionLabel: 'Descending'},
    {label: 'Customer', value: 'customer asc', directionLabel: 'A-Z'},
    {label: 'Customer', value: 'customer desc', directionLabel: 'Z-A'},
    {label: 'Date', value: 'date asc', directionLabel: 'Oldest first'},
    {label: 'Date', value: 'date desc', directionLabel: 'Newest first'},
    {label: 'Total', value: 'total asc', directionLabel: 'Low to high'},
    {label: 'Total', value: 'total desc', directionLabel: 'High to low'},
  ];

  const onHandleCancel = () => {};

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction: IndexFiltersProps['primaryAction'] =
    selected === 0
      ? {
          type: 'save-as',
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: 'save',
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };

  // Filter definitions
  const filters = [
    {
      key: 'paymentStatus',
      label: 'Payment status',
      filter: (
        <ChoiceList
          title="Payment status"
          titleHidden
          choices={[
            {label: 'Paid', value: 'paid'},
            {label: 'Partially paid', value: 'partially'},
            {label: 'Unpaid', value: 'unpaid'},
            {label: 'Pending', value: 'pending'},
          ]}
          selected={paymentStatus || []}
          onChange={handlePaymentStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: 'fulfillmentStatus',
      label: 'Fulfillment status',
      filter: (
        <ChoiceList
          title="Fulfillment status"
          titleHidden
          choices={[
            {label: 'Fulfilled', value: 'fulfilled'},
            {label: 'Unfulfilled', value: 'unfulfilled'},
            {label: 'Partially fulfilled', value: 'partially'},
          ]}
          selected={fulfillmentStatus || []}
          onChange={handleFulfillmentStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: 'customerName',
      label: 'Customer name',
      filter: (
        <TextField
          label="Customer name"
          value={customerName}
          onChange={handleCustomerNameChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: 'orderTotal',
      label: 'Order total',
      filter: (
        <RangeSlider
          label="Order total is between"
          labelHidden
          value={orderTotal || [0, 1000]}
          prefix="$"
          output
          min={0}
          max={2000}
          step={1}
          onChange={handleOrderTotalChange}
        />
      ),
    },
  ];

  // Applied filters
  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (paymentStatus && !isEmpty(paymentStatus)) {
    const key = 'paymentStatus';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, paymentStatus),
      onRemove: handlePaymentStatusRemove,
    });
  }
  if (fulfillmentStatus && !isEmpty(fulfillmentStatus)) {
    const key = 'fulfillmentStatus';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, fulfillmentStatus),
      onRemove: handleFulfillmentStatusRemove,
    });
  }
  if (orderTotal) {
    const key = 'orderTotal';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, orderTotal),
      onRemove: handleOrderTotalRemove,
    });
  }
  if (!isEmpty(customerName)) {
    const key = 'customerName';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, customerName),
      onRemove: handleCustomerNameRemove,
    });
  }

  // Bulk actions
  const bulkActionsPopoverActivator = (
    <Button disclosure onClick={() => setBulkActionsPopoverActive(!bulkActionsPopoverActive)}>
      Bulk actions
    </Button>
  );

  const bulkActions: (MenuGroupDescriptor | any)[] = [
    {
      title: 'Export',
      actions: [
        {
          content: 'Export selected orders',
          onAction: () => {
            console.log('Exporting orders:', selectedResources);
            setBulkActionsPopoverActive(false);
          },
        },
      ],
    },
    {
      title: 'Update',
      actions: [
        {
          content: 'Mark as fulfilled',
          onAction: () => {
            console.log('Marking orders as fulfilled:', selectedResources);
            setBulkActionsPopoverActive(false);
          },
        },
        {
          content: 'Send tracking info',
          onAction: () => {
            console.log('Sending tracking info for orders:', selectedResources);
            setBulkActionsPopoverActive(false);
          },
        },
      ],
    },
  ];

  const promotedBulkActions: (MenuGroupDescriptor | any)[] = [
    {
      content: 'Export selected',
      onAction: () => {
        console.log('Quick export for orders:', selectedResources);
      },
    },
  ];

  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(paginatedOrders);

  const handleOrderClick = (orderId: string) => {
    // Extract just the order number from the full GraphQL ID for clean URLs
    const orderNumber = orderId.split('/').pop();
    console.log('Navigating to order:', orderNumber, 'from ID:', orderId);
    navigate(`/app/orders/${orderNumber}`);
  };

  const rowMarkup = paginatedOrders.map(
    (
      {id, orderNumber, order, date, customer, channel, total, paymentStatus, fulfillmentStatus, items, deliveryStatus, deliveryMethod, tags}: any,
      index: number,
    ) => {
      // Calculate the row number based on current page and index
      const rowNumber = startIndex + index + 1;
      
      return (
        <IndexTable.Row
          id={id}
          key={id}
          selected={selectedResources.includes(id)}
          position={index}
          onClick={() => handleOrderClick(id)}
        >
          <IndexTable.Cell>
            <span style={{ cursor: 'pointer' }}>
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {order}
              </Text>
            </span>
          </IndexTable.Cell>
          <IndexTable.Cell>{date}</IndexTable.Cell>
          <IndexTable.Cell>{customer}</IndexTable.Cell>
          <IndexTable.Cell>{channel}</IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" alignment="end" numeric>
              {total}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
          <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" alignment="end" numeric>
              {items}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{deliveryStatus}</IndexTable.Cell>
          <IndexTable.Cell>{deliveryMethod}</IndexTable.Cell>
          <IndexTable.Cell>{tags}</IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  const emptyState = (
    <EmptyState
      heading="No orders found"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>You haven't received any orders yet. When you do, they'll appear here.</p>
    </EmptyState>
  );

  return (
    <LegacyCard>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching in all orders"
        onQueryChange={handleFiltersQueryChange}
        onQueryClear={() => setQueryValue('')}
        onSort={setSortSelected}
        primaryAction={primaryAction}
        cancelAction={{
          onAction: onHandleCancel,
          disabled: false,
          loading: false,
        }}
        tabs={tabs}
        selected={selected}
        onSelect={setSelected}
        canCreateNewView
        onCreateNewView={onCreateNewView}
        filters={filters}
        appliedFilters={appliedFilters}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <div style={{ height: '500px', overflow: 'auto' }}>
        <IndexTable
          resourceName={resourceName}
          itemCount={filteredAndSortedOrders.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            {title: 'Order'},
            {title: 'Date'},
            {title: 'Customer'},
            {title: 'Channel'},
            {title: 'Total', alignment: 'end'},
            {title: 'Payment status'},
            {title: 'Fulfillment status'},
            {title: 'Items', alignment: 'end'},
            {title: 'Delivery status'},
            {title: 'Delivery method'},
            {title: 'Tags'},
          ]}
          // Sorting features
          sortable={[false, true, true, false, true, false, false, true, false, false, false]}
          sortDirection={sortDirection}
          sortColumnIndex={sortColumnIndex}
          onSort={handleSort}
          defaultSortDirection="descending"
          sortToggleLabels={{
            1: {
              ascending: 'Date: Oldest first',
              descending: 'Date: Newest first',
            },
            2: {
              ascending: 'Customer: A to Z',
              descending: 'Customer: Z to A',
            },
            4: {
              ascending: 'Total: Low to high',
              descending: 'Total: High to low',
            },
            7: {
              ascending: 'Items: Low to high',
              descending: 'Items: High to low',
            },
          }}
          // Bulk actions
          promotedBulkActions={promotedBulkActions}
          bulkActions={bulkActions}
          // Pagination
          pagination={{
            hasNext: currentPage < totalPages,
            hasPrevious: currentPage > 1,
            onNext: () => handlePageChange(currentPage + 1),
            onPrevious: () => handlePageChange(currentPage - 1),
          }}
          // Visual enhancements
          hasZebraStriping={true}
          condensed={breakpoints.smDown}
          // Loading and empty states
          loading={loading}
          emptyState={filteredAndSortedOrders.length === 0 ? emptyState : undefined}
          // Additional features
          selectable={true}
          lastColumnSticky={false}
          paginatedSelectAllActionText="Select all orders"
          paginatedSelectAllText={`Showing ${paginatedOrders.length} of ${filteredAndSortedOrders.length} orders`}
        >
          {rowMarkup}
        </IndexTable>
      </div>
    </LegacyCard>
  );
}

export async function loader({request}: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(ORDERS_QUERY);
  const orders = await response.json();

  return json({
    orders,
    shop: session.shop,
  });
}