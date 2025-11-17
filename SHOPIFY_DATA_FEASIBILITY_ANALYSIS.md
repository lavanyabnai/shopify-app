# Shopify Data Feasibility Analysis for Control Tower Dashboards

## Executive Summary

This document analyzes which control tower dashboards can be built using **only Shopify data** (no 3rd party integrations) and identifies critical gaps that require external systems or mock data.

**Quick Answer:**
- ✅ **Fully Feasible:** Customer Receipt, Supplier (partial)
- ⚠️ **Partially Feasible:** Demand Balancing, Finished Goods
- ❌ **Not Feasible:** Manufacturing, Raw Materials

---

## 1. Customer Forecast Demand (Demand Balancing)

### Required Metrics
1. **Projected Backorders** - Units that will be out of stock
2. **Revenue Impact** - Lost revenue from stockouts
3. **Transfer Recommendations** - Which DC to transfer from/to
4. **Forecast vs Actual** - Demand prediction accuracy
5. **Confidence Level** - ML prediction reliability
6. **Current Stock by Location** - Inventory levels per DC
7. **Projected Demand** - Future sales forecast

### Shopify Data Availability

#### ✅ Available via Shopify API

**Inventory Levels (by Location):**
```graphql
query InventoryByLocation {
  locations(first: 250) {
    nodes {
      id
      name
      address {
        city
        countryCode
      }
      inventoryLevels(first: 250) {
        nodes {
          item {
            id
            sku
            variant {
              id
              title
              price
              product {
                title
              }
            }
          }
          quantities(names: ["available", "incoming", "committed", "reserved"]) {
            name
            quantity
          }
        }
      }
    }
  }
}
```

**Historical Orders (for trend analysis):**
```graphql
query OrderHistory {
  orders(first: 250, query: "created_at:>2024-01-01") {
    nodes {
      id
      name
      createdAt
      totalPriceSet {
        shopMoney {
          amount
        }
      }
      lineItems(first: 250) {
        nodes {
          quantity
          sku
          variant {
            id
            inventoryItem {
              id
            }
          }
        }
      }
    }
  }
}
```

**Product Pricing:**
```graphql
query ProductPricing {
  products(first: 250) {
    nodes {
      id
      title
      variants(first: 250) {
        nodes {
          id
          sku
          price
          inventoryItem {
            id
          }
        }
      }
    }
  }
}
```

#### ❌ NOT Available via Shopify API

1. **Multi-DC Transfer Recommendations**
   - Shopify has `InventoryMoveQuantity` mutation but **no built-in demand forecasting**
   - No "transfer from L02 to L04" logic
   - **Workaround:** You must implement custom logic:
     - Calculate projected demand from historical order velocity
     - Compare against available inventory per location
     - Generate transfer recommendations based on deficit/surplus

2. **Demand Forecasting (ML-based)**
   - Shopify has no predictive analytics API
   - **Workaround:** Build custom forecasting:
     ```typescript
     // Calculate 30-day rolling average velocity
     const velocity = orders
       .filter(o => o.createdAt > thirtyDaysAgo)
       .reduce((sum, o) => sum + o.lineItems.find(i => i.sku === sku).quantity, 0) / 30

     // Project 7-day demand
     const projectedDemand = velocity * 7

     // Calculate backorders
     const backorders = Math.max(0, projectedDemand - currentStock)
     ```

3. **Confidence Level (ML)**
   - No Shopify API for prediction confidence
   - **Workaround:** Calculate based on historical accuracy:
     ```typescript
     // Compare past predictions vs actual sales
     const mape = Math.abs(predicted - actual) / actual
     const confidenceLevel = (1 - mape) * 100
     ```

4. **Projected Backorders**
   - Not a Shopify concept (Shopify only tracks "continue selling when out of stock")
   - **Workaround:** Calculate manually:
     ```typescript
     const backorders = Math.max(0, projectedDemand - availableInventory)
     ```

### Feasibility: ⚠️ **PARTIALLY FEASIBLE**

**What You Can Build:**
- ✅ Real-time inventory levels per location
- ✅ Historical order velocity trends
- ✅ Revenue impact (price × backorder units)
- ✅ Current stock vs demand gap

**What Requires Custom Implementation:**
- ⚠️ Demand forecasting (basic: rolling average, advanced: ML model)
- ⚠️ Transfer recommendations (custom logic)
- ⚠️ Confidence scoring (statistical calculation)
- ⚠️ Multi-location optimization (custom algorithm)

**Risk Level:** 🟡 **MEDIUM**
- Core functionality achievable with Shopify data + custom logic
- Advanced features require your own forecasting algorithms
- No 3rd party integration required (can use local DB + Redis)

---

## 2. Finished Goods

### Required Metrics
1. **FG Coverage** - Days of inventory remaining
2. **Stock Status** - In Stock / Low Stock / Out of Stock
3. **Replenishment Alerts** - When to reorder
4. **Inventory Turnover** - How fast products sell
5. **ABC Classification** - High/Medium/Low value products

### Shopify Data Availability

#### ✅ Available via Shopify API

**Inventory Quantities:**
```graphql
query FinishedGoodsInventory {
  products(first: 250) {
    nodes {
      id
      title
      productType
      variants(first: 250) {
        nodes {
          id
          sku
          price
          inventoryItem {
            id
            inventoryLevels(first: 10) {
              nodes {
                location {
                  name
                }
                quantities(names: ["available", "incoming"]) {
                  name
                  quantity
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Sales Velocity (from Orders):**
```graphql
query SalesVelocity($startDate: DateTime!) {
  orders(first: 250, query: "created_at:>{{startDate}}") {
    nodes {
      createdAt
      lineItems(first: 250) {
        nodes {
          sku
          quantity
          variant {
            id
          }
        }
      }
    }
  }
}
```

#### ✅ Can Calculate from Shopify Data

1. **FG Coverage (Days of Inventory)**
   ```typescript
   // Calculate sales velocity (units per day)
   const velocity = totalSoldLast30Days / 30

   // Calculate days of coverage
   const coverage = currentInventory / velocity
   ```

2. **Inventory Turnover**
   ```typescript
   const turnover = totalSoldLastYear / averageInventory
   ```

3. **ABC Classification**
   ```typescript
   // A items: Top 20% by revenue (80% of total revenue)
   // B items: Next 30% by revenue (15% of total revenue)
   // C items: Bottom 50% by revenue (5% of total revenue)
   const revenueByProduct = products.map(p => ({
     sku: p.sku,
     revenue: p.price * p.soldQuantity
   })).sort((a, b) => b.revenue - a.revenue)
   ```

4. **Replenishment Alerts**
   ```typescript
   // Reorder point = (Lead time × Daily velocity) + Safety stock
   const reorderPoint = (leadTimeDays * velocity) + safetyStock
   const shouldReorder = currentInventory <= reorderPoint
   ```

#### ❌ NOT Available via Shopify API

1. **Manufacturing Lead Time**
   - Not stored in Shopify
   - **Workaround:** Store in custom metafields:
     ```graphql
     mutation AddLeadTime {
       productUpdate(input: {
         id: "gid://shopify/Product/123"
         metafields: [{
           namespace: "custom"
           key: "manufacturing_lead_time_days"
           value: "14"
           type: "number_integer"
         }]
       }) {
         product { id }
       }
     }
     ```

2. **Safety Stock Levels**
   - Not a Shopify concept
   - **Workaround:** Store in metafields or local database

3. **Supplier Information**
   - Shopify doesn't track suppliers
   - **Workaround:** Use product tags or metafields

### Feasibility: ⚠️ **PARTIALLY FEASIBLE**

**What You Can Build:**
- ✅ FG coverage calculation (inventory ÷ velocity)
- ✅ Stock status based on quantity thresholds
- ✅ Inventory turnover from historical sales
- ✅ ABC classification from revenue data

**What Requires Workarounds:**
- ⚠️ Reorder points (need lead time + safety stock in metafields)
- ⚠️ Supplier data (use tags/metafields)

**Risk Level:** 🟢 **LOW**
- 90% achievable with Shopify data alone
- Minor data augmentation via metafields
- No external APIs required

---

## 3. Customer Receipt (OTIF Performance)

### Required Metrics
1. **OTIF (On-Time, In-Full) %** - Orders delivered on time and complete
2. **Order Fulfillment Rate** - % of orders shipped
3. **Average Delivery Time** - Days from order to delivery
4. **Damaged/Returned Items** - Quality issues

### Shopify Data Availability

#### ✅ Available via Shopify API

**Fulfillment Data:**
```graphql
query Fulfillments {
  orders(first: 250) {
    nodes {
      id
      name
      createdAt
      fulfillments {
        id
        status
        createdAt
        deliveredAt
        estimatedDeliveryAt
        trackingInfo {
          number
          url
        }
      }
      lineItems(first: 250) {
        nodes {
          quantity
          fulfillableQuantity
          fulfillmentStatus
        }
      }
    }
  }
}
```

**Returns (via Return object - Shopify Plus only):**
```graphql
query Returns {
  returns(first: 250) {
    nodes {
      id
      status
      order {
        id
      }
      returnLineItems(first: 250) {
        nodes {
          quantity
          returnReason
        }
      }
    }
  }
}
```

#### ✅ Can Calculate from Shopify Data

1. **OTIF Percentage**
   ```typescript
   // On-Time: deliveredAt <= estimatedDeliveryAt
   const onTime = fulfillments.filter(f =>
     f.deliveredAt && f.deliveredAt <= f.estimatedDeliveryAt
   ).length

   // In-Full: all line items fulfilled
   const inFull = orders.filter(o =>
     o.lineItems.every(li => li.fulfillmentStatus === "FULFILLED")
   ).length

   const otif = (onTime && inFull) / totalOrders * 100
   ```

2. **Fulfillment Rate**
   ```typescript
   const fulfilled = orders.filter(o => o.fulfillmentStatus === "FULFILLED").length
   const rate = fulfilled / totalOrders * 100
   ```

3. **Average Delivery Time**
   ```typescript
   const deliveryTimes = fulfillments
     .filter(f => f.deliveredAt)
     .map(f => daysBetween(f.createdAt, f.deliveredAt))

   const avgDeliveryTime = mean(deliveryTimes)
   ```

#### ⚠️ Limited Availability

1. **Delivered At Date**
   - Only available if carrier provides tracking updates
   - Many merchants don't have `deliveredAt` populated
   - **Workaround:** Use `estimatedDeliveryAt + buffer days`

2. **Damaged Items**
   - Return reasons include "DEFECTIVE" but not all merchants use returns API
   - **Workaround:** Parse return notes/tags

### Feasibility: ✅ **FULLY FEASIBLE**

**What You Can Build:**
- ✅ OTIF calculation (if deliveredAt is populated)
- ✅ Fulfillment rate (always available)
- ✅ Average delivery time (from fulfillment timestamps)
- ✅ Return rate (if using Returns API)

**Risk Level:** 🟢 **LOW**
- 95% achievable with standard Shopify data
- `deliveredAt` may be missing (use estimates instead)

---

## 4. Manufacturing

### Required Metrics
1. **Production OTIF** - On-time manufacturing completion
2. **Work Order Status** - In Progress / Completed
3. **Production Capacity** - Units per day
4. **Bill of Materials (BOM)** - Raw materials per product
5. **Production Lead Time** - Days to manufacture

### Shopify Data Availability

#### ❌ NOT Available via Shopify API

**Critical Gap:** Shopify is an **e-commerce platform**, not a manufacturing ERP system.

**Missing Data:**
- ❌ Work orders / production orders
- ❌ Manufacturing schedules
- ❌ Bill of materials (BOM)
- ❌ Production capacity
- ❌ Manufacturing lead times
- ❌ Work-in-progress inventory

#### ⚠️ Workaround Options

1. **Use Draft Orders as "Work Orders"**
   ```graphql
   query DraftOrders {
     draftOrders(first: 250) {
       nodes {
         id
         name
         status
         tags # Use tags like "PRODUCTION", "WO-12345"
         createdAt
         lineItems(first: 250) {
           nodes {
             quantity
             variant {
               id
               sku
             }
           }
         }
       }
     }
   }
   ```

2. **Store BOM in Product Metafields**
   ```graphql
   mutation AddBOM {
     productUpdate(input: {
       id: "gid://shopify/Product/123"
       metafields: [{
         namespace: "manufacturing"
         key: "bom"
         value: "{\"materials\": [{\"sku\": \"RM-001\", \"quantity\": 5}]}"
         type: "json"
       }]
     }) {
       product { id }
     }
   }
   ```

3. **Use Inventory Transfers as "Production Completion"**
   ```graphql
   mutation CompleteProduction {
     inventoryMoveQuantities(input: {
       reason: "production_completion"
       changes: [{
         inventoryItemId: "gid://shopify/InventoryItem/123"
         locationId: "gid://shopify/Location/456"
         delta: 100
       }]
     }) {
       inventoryAdjustmentGroup { id }
     }
   }
   ```

### Feasibility: ❌ **NOT FEASIBLE** (Without Workarounds)

**What You Cannot Build with Shopify Alone:**
- ❌ True manufacturing dashboard
- ❌ Production scheduling
- ❌ BOM explosion/implosion
- ❌ Work order tracking

**What You Can Build (Hacky Workarounds):**
- ⚠️ Use Draft Orders as pseudo work orders
- ⚠️ Store BOM in metafields
- ⚠️ Track production via inventory adjustments
- ⚠️ Store lead times in metafields

**Risk Level:** 🔴 **HIGH**
- Requires significant data modeling outside Shopify's domain
- Better served by integration with MES/ERP (e.g., NetSuite, SAP, Katana)
- **Recommendation:** Mock data only, or integrate with manufacturing system

---

## 5. Supplier

### Required Metrics
1. **Supplier OTIF** - On-time delivery from suppliers
2. **Purchase Order Status** - PO tracking
3. **Supplier Lead Times** - Days from PO to receipt
4. **Quality Metrics** - Defect rates

### Shopify Data Availability

#### ✅ **CORRECTION: Purchase Orders ARE Available in Shopify Admin!**

**Important Update:** Shopify DOES have a native Purchase Order system accessible via:
- **Admin UI:** Products > Purchase orders
- **Features:** Create POs, track suppliers, receive inventory, manage costs

**However, there's a critical limitation:**
- ❌ **Purchase Orders are NOT exposed in the GraphQL Admin API**
- ❌ **No REST API for Purchase Orders**
- ✅ **Only available in the Shopify Admin UI**

This means:
- You can manually manage POs in the Shopify admin
- Apps cannot programmatically access PO data via API
- PO information might be stored as metafields on inventory items

#### ⚠️ Limited API Availability

**Incoming Inventory (Indirect PO tracking):**
```graphql
query IncomingInventory {
  inventoryItems(first: 250) {
    nodes {
      id
      sku
      inventoryLevels(first: 10) {
        nodes {
          location {
            name
          }
          quantities(names: ["incoming"]) {
            name
            quantity
          }
          incoming(first: 10) {
            nodes {
              id
              scheduledAt
            }
          }
        }
      }
    }
  }
}
```

**Product Vendor Field (Supplier Name):**
```graphql
query ProductVendors {
  products(first: 250) {
    nodes {
      id
      title
      vendor # Built-in supplier/vendor field
      variants {
        nodes {
          sku
          inventoryItem {
            id
            unitCost {
              amount
            }
          }
        }
      }
    }
  }
}
```

#### ⚠️ Workarounds for PO Data

Since POs aren't in the API, you can:

1. **Track via Metafields**
   - When you create a PO in Shopify admin, manually add PO details to product metafields
   ```graphql
   metafields: [{
     namespace: "supplier"
     key: "last_po_number"
     value: "PO-2024-001"
   }, {
     namespace: "supplier"
     key: "expected_delivery_date"
     value: "2024-12-15"
   }]
   ```

2. **Use Incoming Inventory + Scheduled Receipts**
   - Track `incoming` quantities and `scheduledAt` dates
   - This reflects POs that have been received in the system

3. **Build Your Own PO System**
   - Store PO data in your app's database
   - Link to Shopify products via SKU/variant ID
   - Manually sync when receiving inventory in Shopify

### Feasibility: ⚠️ **PARTIALLY FEASIBLE**

**What You CAN Build:**
- ✅ Track incoming inventory quantities (from POs marked in admin)
- ✅ Use product `vendor` field for supplier names
- ✅ Calculate expected arrival dates from `scheduledAt`
- ✅ Track unit costs per variant

**What You CANNOT Build (API Limitation):**
- ❌ Query Purchase Orders directly
- ❌ Get PO numbers, dates, payment terms from API
- ❌ Track PO approval workflow
- ❌ Access supplier contact details (unless in metafields)

**What Requires Custom Implementation:**
- ⚠️ Build PO tracking in your own database
- ⚠️ Manually sync with Shopify admin PO data
- ⚠️ Store supplier scorecards separately
- ⚠️ Track quality metrics in your app

**Risk Level:** 🟡 **MEDIUM-HIGH**
- POs exist in Shopify but NOT accessible via API (major limitation)
- Can track basic supplier data (`vendor` field, incoming inventory)
- Enterprise PO features require custom database or 3rd party app (Stocky, Cin7)

---

## 6. Raw Materials

### Required Metrics
1. **RM Coverage** - Days of raw material inventory
2. **Reorder Alerts** - When to reorder materials
3. **Supplier Lead Times** - RM delivery times
4. **Safety Stock** - Buffer inventory levels

### Shopify Data Availability

#### ❌ NOT Available via Shopify API

**Critical Gap:** Shopify doesn't distinguish between raw materials and finished goods.

**Missing Concepts:**
- ❌ Raw material inventory tracking
- ❌ Component-level BOMs
- ❌ Manufacturing consumption
- ❌ MRP (Material Requirements Planning)

#### ⚠️ Workaround Options

1. **Use Product Type as "Material Type"**
   ```graphql
   query RawMaterials {
     products(first: 250, query: "product_type:raw_material") {
       nodes {
         id
         title
         productType
         variants {
           nodes {
             sku
             inventoryItem {
               id
               inventoryLevels {
                 nodes {
                   quantities(names: "available") {
                     quantity
                   }
                 }
               }
             }
           }
         }
       }
     }
   }
   ```

2. **Store BOM Relationships in Metafields**
   ```json
   {
     "namespace": "manufacturing",
     "key": "consumes_materials",
     "value": [
       {"sku": "RM-STEEL-001", "quantity_per_unit": 2.5},
       {"sku": "RM-PLASTIC-002", "quantity_per_unit": 1.0}
     ]
   }
   ```

3. **Calculate RM Coverage Manually**
   ```typescript
   // Get finished goods demand forecast
   const fgDemand = calculateDemand("FG-WIDGET-001")

   // Get BOM for finished goods
   const bom = getBOM("FG-WIDGET-001") // From metafields

   // Calculate raw material requirement
   const rmRequired = fgDemand * bom.find(m => m.sku === "RM-STEEL-001").quantity

   // Get current RM inventory
   const rmInventory = getCurrentInventory("RM-STEEL-001")

   // Calculate days of coverage
   const coverage = rmInventory / (rmRequired / forecastDays)
   ```

### Feasibility: ❌ **NOT FEASIBLE** (Without Heavy Customization)

**What You Cannot Build:**
- ❌ True MRP system
- ❌ Automated material consumption tracking
- ❌ Multi-level BOM explosion

**What You Can Build (Workarounds):**
- ⚠️ Tag products as "raw_material" vs "finished_goods"
- ⚠️ Store BOMs in metafields
- ⚠️ Manually calculate RM requirements from FG forecasts
- ⚠️ Track RM inventory like regular products

**Risk Level:** 🔴 **HIGH**
- Shopify is not designed for manufacturing/MRP
- **Recommendation:** Mock data only, or integrate with ERP

---

## Summary: Feasibility Matrix

| Dashboard | Feasibility | Shopify Data | Custom Logic | External Data | Risk | Recommendation |
|-----------|-------------|--------------|--------------|---------------|------|----------------|
| **Customer Forecast Demand** | ⚠️ Partial | 70% | 30% | 0% | 🟡 Medium | Build with custom forecasting |
| **Finished Goods** | ✅ High | 90% | 10% | 0% | 🟢 Low | Fully build with Shopify |
| **Customer Receipt** | ✅ High | 95% | 5% | 0% | 🟢 Low | Fully build with Shopify |
| **Manufacturing** | ❌ Low | 20% | 40% | 40% | 🔴 High | Mock data or ERP integration |
| **Supplier** | ⚠️ Partial | 50% | 30% | 20% | 🟡 Medium | Use incoming inventory + vendor field |
| **Raw Materials** | ❌ Low | 20% | 40% | 40% | 🔴 High | Mock data or ERP integration |

---

## Recommended Implementation Strategy

### Phase 1: Quick Wins (Shopify-Native) ✅
Build these first with 100% Shopify data:
1. **Customer Receipt (OTIF)** - Use fulfillment API
2. **Finished Goods Coverage** - Use inventory + order history

### Phase 2: Enhanced Analytics (Shopify + Custom Logic) ⚠️
Add custom forecasting to:
1. **Demand Balancing** - Rolling average or ARIMA forecasting
2. **Supplier Tracking** - Use metafields for supplier data

### Phase 3: Mock Data for Manufacturing Dashboards 🔴
For Manufacturing and Raw Materials:
1. Use hardcoded mock data (like your current implementation)
2. Display "Coming Soon - Requires ERP Integration" banner
3. Build UI/UX, but don't connect to Shopify

### Phase 4: Future Integrations (If Needed) 🔮
If client wants real manufacturing data:
1. Integrate with NetSuite/SAP/Katana API
2. Build webhook listeners for PO/Work Order updates
3. Sync BOM data from ERP to Shopify metafields

---

## Code Implementation Guide

### 1. Demand Balancing (Feasible with Custom Logic)

**File:** `app/services/demand-forecast.server.ts`

```typescript
import { db } from "~/db.server"

interface ForecastResult {
  sku: string
  currentStock: number
  projectedDemand: number
  backorders: number
  revenueImpact: number
  confidenceLevel: number
}

export async function calculateDemandForecast(
  admin: any, // Shopify GraphQL client
  forecastDays: number = 7
): Promise<ForecastResult[]> {

  // 1. Get inventory levels by location
  const inventoryResponse = await admin.graphql(`
    query {
      locations(first: 10) {
        nodes {
          id
          name
          inventoryLevels(first: 250) {
            nodes {
              item {
                sku
                variant {
                  id
                  price
                }
              }
              quantities(names: "available") {
                name
                quantity
              }
            }
          }
        }
      }
    }
  `)

  const { locations } = await inventoryResponse.json()

  // 2. Get historical orders (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const ordersResponse = await admin.graphql(`
    query($since: DateTime!) {
      orders(first: 250, query: "created_at:>${since}") {
        nodes {
          createdAt
          lineItems(first: 250) {
            nodes {
              sku
              quantity
            }
          }
        }
      }
    }
  `, {
    variables: { since: thirtyDaysAgo.toISOString() }
  })

  const { orders } = await ordersResponse.json()

  // 3. Calculate velocity per SKU
  const velocityMap = new Map<string, number>()

  for (const order of orders.nodes) {
    for (const item of order.lineItems.nodes) {
      const current = velocityMap.get(item.sku) || 0
      velocityMap.set(item.sku, current + item.quantity)
    }
  }

  // 4. Calculate forecast for each SKU
  const forecasts: ForecastResult[] = []

  for (const location of locations.nodes) {
    for (const level of location.inventoryLevels.nodes) {
      const sku = level.item.sku
      const currentStock = level.quantities.find(q => q.name === "available")?.quantity || 0

      // Calculate daily velocity
      const totalSold = velocityMap.get(sku) || 0
      const dailyVelocity = totalSold / 30

      // Project demand
      const projectedDemand = Math.round(dailyVelocity * forecastDays)

      // Calculate backorders
      const backorders = Math.max(0, projectedDemand - currentStock)

      // Calculate revenue impact
      const price = parseFloat(level.item.variant?.price || "0")
      const revenueImpact = backorders * price

      // Calculate confidence (simple: based on consistency)
      const stdDev = calculateStdDev(orders.nodes, sku)
      const cv = stdDev / dailyVelocity // Coefficient of variation
      const confidenceLevel = Math.max(0, Math.min(100, (1 - cv) * 100))

      if (backorders > 0) {
        forecasts.push({
          sku,
          currentStock,
          projectedDemand,
          backorders,
          revenueImpact,
          confidenceLevel
        })
      }
    }
  }

  return forecasts.sort((a, b) => b.revenueImpact - a.revenueImpact)
}

function calculateStdDev(orders: any[], sku: string): number {
  // Calculate daily sales for last 30 days
  const dailySales = new Map<string, number>()

  for (const order of orders) {
    const date = order.createdAt.split('T')[0]
    const quantity = order.lineItems.nodes
      .filter((i: any) => i.sku === sku)
      .reduce((sum: number, i: any) => sum + i.quantity, 0)

    dailySales.set(date, (dailySales.get(date) || 0) + quantity)
  }

  const values = Array.from(dailySales.values())
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length

  return Math.sqrt(variance)
}
```

### 2. Finished Goods Coverage (Fully Shopify)

**File:** `app/services/finished-goods.server.ts`

```typescript
export async function calculateFGCoverage(admin: any) {
  // Get inventory and sales velocity
  const response = await admin.graphql(`
    query {
      products(first: 250, query: "product_type:finished_goods") {
        nodes {
          id
          title
          variants {
            nodes {
              id
              sku
              price
              inventoryItem {
                id
                inventoryLevels {
                  nodes {
                    quantities(names: "available") {
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `)

  const { products } = await response.json()

  // Calculate coverage for each product
  return products.nodes.map((product: any) => {
    const variant = product.variants.nodes[0]
    const inventory = variant.inventoryItem.inventoryLevels.nodes[0]?.quantities[0]?.quantity || 0

    // Get velocity from database (pre-computed from orders)
    const velocity = getVelocityFromDB(variant.sku) // Your implementation

    const coverage = velocity > 0 ? inventory / velocity : 999

    return {
      sku: variant.sku,
      title: product.title,
      inventory,
      velocity,
      coverage,
      status: coverage < 7 ? "LOW" : coverage < 30 ? "MEDIUM" : "HIGH"
    }
  })
}
```

### 3. Customer Receipt OTIF (Fully Shopify)

**File:** `app/services/customer-otif.server.ts`

```typescript
export async function calculateOTIF(admin: any, days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const response = await admin.graphql(`
    query($since: DateTime!) {
      orders(first: 250, query: "created_at:>${since}") {
        nodes {
          id
          createdAt
          fulfillmentStatus
          fulfillments {
            id
            status
            createdAt
            deliveredAt
            estimatedDeliveryAt
          }
          lineItems {
            nodes {
              quantity
              fulfillmentStatus
            }
          }
        }
      }
    }
  `, {
    variables: { since: since.toISOString() }
  })

  const { orders } = await response.json()

  let onTimeCount = 0
  let inFullCount = 0
  let totalOrders = orders.nodes.length

  for (const order of orders.nodes) {
    // Check In-Full
    const allFulfilled = order.lineItems.nodes.every(
      (item: any) => item.fulfillmentStatus === "FULFILLED"
    )
    if (allFulfilled) inFullCount++

    // Check On-Time
    const fulfillment = order.fulfillments[0]
    if (fulfillment?.deliveredAt && fulfillment?.estimatedDeliveryAt) {
      const delivered = new Date(fulfillment.deliveredAt)
      const estimated = new Date(fulfillment.estimatedDeliveryAt)

      if (delivered <= estimated) onTimeCount++
    }
  }

  return {
    otifPercentage: ((onTimeCount / totalOrders) * 100).toFixed(1),
    inFullPercentage: ((inFullCount / totalOrders) * 100).toFixed(1),
    onTimePercentage: ((onTimeCount / totalOrders) * 100).toFixed(1),
    totalOrders
  }
}
```

---

## Conclusion

### ✅ You CAN Build (Shopify Data Only):
1. **Customer Receipt (OTIF)** - 95% feasible
2. **Finished Goods** - 90% feasible
3. **Demand Balancing** - 70% feasible (needs custom forecasting)

### ⚠️ You SHOULD Use Mock Data:
1. **Manufacturing** - 20% feasible (Shopify isn't an ERP)
2. **Raw Materials** - 20% feasible (no MRP concepts)
3. **Supplier** - 40% feasible (no PO system)

### 🎯 Recommended Approach:
- **Phase 1:** Build Customer Receipt + Finished Goods with real Shopify data
- **Phase 2:** Add custom forecasting for Demand Balancing
- **Phase 3:** Keep Manufacturing/RM/Supplier as mock dashboards
- **Phase 4:** Document "Requires ERP integration" for enterprise features

This gives you a **production-ready app** with real value for Shopify merchants while being honest about manufacturing limitations.
