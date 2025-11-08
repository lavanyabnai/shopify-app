import shopify from "~/shopify.server"

// GraphQL queries for Shopify inventory management
export const INVENTORY_LEVELS_QUERY = `
  query getInventoryLevels($first: Int!, $after: String) {
    inventoryLevels(first: $first, after: $after) {
      edges {
        node {
          id
          available
          item {
            id
            sku
            variant {
              id
              title
              price
              product {
                id
                title
                status
                tags
                vendor
                productType
              }
            }
          }
          location {
            id
            name
            address {
              address1
              city
              province
              country
            }
          }
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const INVENTORY_ITEM_QUERY = `
  query getInventoryItem($id: ID!) {
    inventoryItem(id: $id) {
      id
      sku
      variant {
        id
        title
        price
        product {
          id
          title
          status
          tags
          vendor
          productType
        }
      }
      inventoryLevels(first: 10) {
        edges {
          node {
            id
            available
            committed
            reserved
            damaged
            safetyStock
            qualityControl
            incoming
            onHand
            location {
              id
              name
            }
            updatedAt
          }
        }
      }
    }
  }
`

export const INVENTORY_ADJUST_QUANTITIES_MUTATION = `
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        id
        reason
        referenceDocumentUri
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
            sku
          }
          location {
            id
            name
          }
        }
        app {
          id
        }
        user {
          id
        }
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const INVENTORY_SET_QUANTITIES_MUTATION = `
  mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
    inventorySetQuantities(input: $input) {
      inventoryAdjustmentGroup {
        id
        reason
        referenceDocumentUri
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
            sku
          }
          location {
            id
            name
          }
        }
        app {
          id
        }
        user {
          id
        }
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const INVENTORY_MOVE_QUANTITIES_MUTATION = `
  mutation inventoryMoveQuantities($input: InventoryMoveQuantitiesInput!) {
    inventoryMoveQuantities(input: $input) {
      inventoryAdjustmentGroup {
        id
        reason
        referenceDocumentUri
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
            sku
          }
          location {
            id
            name
          }
        }
        app {
          id
        }
        user {
          id
        }
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`

// Server-side functions for inventory management
export async function getInventoryLevels(session: any, first: number = 50, after?: string) {
  try {
    const client = new shopify.clients.Graphql({ session })
    
    const response = await client.request(INVENTORY_LEVELS_QUERY, {
      variables: {
        first,
        after
      }
    })

    return response.body.data.inventoryLevels
  } catch (error) {
    console.error('Error fetching inventory levels:', error)
    throw error
  }
}

export async function getInventoryItem(session: any, itemId: string) {
  try {
    const client = new shopify.clients.Graphql({ session })
    
    const response = await client.request(INVENTORY_ITEM_QUERY, {
      variables: {
        id: itemId
      }
    })

    return response.body.data.inventoryItem
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    throw error
  }
}

export async function adjustInventoryQuantities(
  session: any, 
  adjustments: Array<{
    inventoryItemId: string
    locationId: string
    delta: number
    reason?: string
    referenceDocumentUri?: string
  }>
) {
  try {
    const client = new shopify.clients.Graphql({ session })
    
    const response = await client.request(INVENTORY_ADJUST_QUANTITIES_MUTATION, {
      variables: {
        input: {
          reason: adjustments[0]?.reason || "Inventory adjustment",
          referenceDocumentUri: adjustments[0]?.referenceDocumentUri,
          changes: adjustments.map(adj => ({
            inventoryItemId: adj.inventoryItemId,
            locationId: adj.locationId,
            delta: adj.delta
          }))
        }
      }
    })

    if (response.body.data.inventoryAdjustQuantities.userErrors.length > 0) {
      throw new Error(response.body.data.inventoryAdjustQuantities.userErrors[0].message)
    }

    return response.body.data.inventoryAdjustQuantities.inventoryAdjustmentGroup
  } catch (error) {
    console.error('Error adjusting inventory quantities:', error)
    throw error
  }
}

export async function setInventoryQuantities(
  session: any,
  quantities: Array<{
    inventoryItemId: string
    locationId: string
    quantity: number
    reason?: string
    referenceDocumentUri?: string
  }>
) {
  try {
    const client = new shopify.clients.Graphql({ session })
    
    const response = await client.request(INVENTORY_SET_QUANTITIES_MUTATION, {
      variables: {
        input: {
          reason: quantities[0]?.reason || "Inventory quantity set",
          referenceDocumentUri: quantities[0]?.referenceDocumentUri,
          setQuantities: quantities.map(qty => ({
            inventoryItemId: qty.inventoryItemId,
            locationId: qty.locationId,
            quantity: qty.quantity
          }))
        }
      }
    })

    if (response.body.data.inventorySetQuantities.userErrors.length > 0) {
      throw new Error(response.body.data.inventorySetQuantities.userErrors[0].message)
    }

    return response.body.data.inventorySetQuantities.inventoryAdjustmentGroup
  } catch (error) {
    console.error('Error setting inventory quantities:', error)
    throw error
  }
}

export async function moveInventoryQuantities(
  session: any,
  moves: Array<{
    inventoryItemId: string
    locationId: string
    fromState: 'available' | 'reserved' | 'damaged' | 'safety_stock' | 'quality_control'
    toState: 'available' | 'reserved' | 'damaged' | 'safety_stock' | 'quality_control'
    quantity: number
    reason?: string
    referenceDocumentUri?: string
  }>
) {
  try {
    const client = new shopify.clients.Graphql({ session })
    
    const response = await client.request(INVENTORY_MOVE_QUANTITIES_MUTATION, {
      variables: {
        input: {
          reason: moves[0]?.reason || "Inventory quantity moved",
          referenceDocumentUri: moves[0]?.referenceDocumentUri,
          moves: moves.map(move => ({
            inventoryItemId: move.inventoryItemId,
            locationId: move.locationId,
            fromState: move.fromState,
            toState: move.toState,
            quantity: move.quantity
          }))
        }
      }
    })

    if (response.body.data.inventoryMoveQuantities.userErrors.length > 0) {
      throw new Error(response.body.data.inventoryMoveQuantities.userErrors[0].message)
    }

    return response.body.data.inventoryMoveQuantities.inventoryAdjustmentGroup
  } catch (error) {
    console.error('Error moving inventory quantities:', error)
    throw error
  }
}

// Helper function to transform Shopify data to our component format
export function transformInventoryData(shopifyData: any): any[] {
  return shopifyData.edges.map((edge: any) => {
    const node = edge.node
    const item = node.item
    const variant = item.variant
    const product = variant.product
    const location = node.location

    return {
      id: item.id,
      sku: item.sku,
      title: variant.title,
      variantId: variant.id,
      locationId: location.id,
      locationName: location.name,
      available: node.available || 0,
      committed: node.committed || 0,
      reserved: node.reserved || 0,
      damaged: node.damaged || 0,
      safetyStock: node.safetyStock || 0,
      qualityControl: node.qualityControl || 0,
      incoming: node.incoming || 0,
      onHand: node.onHand || 0,
      cost: 0, // This would need to be fetched separately or stored
      price: parseFloat(variant.price),
      status: product.status,
      lastUpdated: node.updatedAt,
      reorderPoint: 0, // This would need to be configured
      reorderQuantity: 0, // This would need to be configured
      supplier: product.vendor,
      category: product.productType,
      tags: product.tags
    }
  })
}
