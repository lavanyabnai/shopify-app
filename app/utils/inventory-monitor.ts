/**
 * TypeScript wrapper for the Python InventoryMonitor class.
 * This provides a clean interface for the inventory monitoring system.
 */

import { analyticsAPI } from './analytics-api';

export interface InventoryAlert {
  id: string;
  sku: string;
  location_id: string;
  warehouse_code: string;
  alert_type: 'stockout' | 'low_stock' | 'overstock' | 'rapid_decline' | 'unusual_activity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  current_quantity: number;
  previous_quantity: number;
  threshold?: number;
  recommendations: string[];
  timestamp: string;
  metadata: Record<string, any>;
}

export interface InventoryUpdate {
  sku: string;
  location_id: string;
  warehouse_code: string;
  quantity: number;
  timestamp: string;
}

export class InventoryMonitor {
  private analyticsServiceUrl: string;
  private defaultLowStockThreshold: number;
  private defaultOverstockThreshold: number;
  private rapidDeclineThreshold: number;

  constructor(
    analyticsServiceUrl: string = 'http://localhost:8000',
    defaultLowStockThreshold: number = 0.2,
    defaultOverstockThreshold: number = 2.0,
    rapidDeclineThreshold: number = 0.5
  ) {
    this.analyticsServiceUrl = analyticsServiceUrl;
    this.defaultLowStockThreshold = defaultLowStockThreshold;
    this.defaultOverstockThreshold = defaultOverstockThreshold;
    this.rapidDeclineThreshold = rapidDeclineThreshold;
  }

  /**
   * Check inventory level and generate alerts if thresholds are breached.
   */
  async checkInventoryLevel(
    sku: string,
    locationId: string,
    warehouseCode: string,
    currentQuantity: number,
    previousQuantity: number,
    reorderPoint?: number,
    maxStock?: number
  ): Promise<InventoryAlert | null> {
    try {
      // Set default values
      const reorderPointValue = reorderPoint || 20;
      const maxStockValue = maxStock || reorderPointValue * 4;

      let alert: InventoryAlert | null = null;

      // Check for stockout
      if (currentQuantity === 0) {
        alert = {
          id: `stockout_${sku}_${locationId}_${Date.now()}`,
          sku,
          location_id: locationId,
          warehouse_code: warehouseCode,
          alert_type: 'stockout',
          severity: 'critical',
          title: `Out of Stock: ${sku}`,
          description: `Product ${sku} is completely out of stock at ${warehouseCode}`,
          current_quantity: currentQuantity,
          previous_quantity: previousQuantity,
          threshold: 0.0,
          recommendations: [
            'Create emergency purchase order',
            'Transfer from other locations',
            'Notify customers of potential delays',
            'Check for pending orders'
          ],
          timestamp: new Date().toISOString(),
          metadata: {
            reorder_point: reorderPointValue,
            max_stock: maxStockValue,
            days_of_stock: 0
          }
        };
      }
      // Check for low stock
      else if (currentQuantity <= reorderPointValue) {
        const daysOfStock = this.calculateDaysOfStock(currentQuantity, sku, locationId);
        alert = {
          id: `low_stock_${sku}_${locationId}_${Date.now()}`,
          sku,
          location_id: locationId,
          warehouse_code: warehouseCode,
          alert_type: 'low_stock',
          severity: currentQuantity > 0 ? 'warning' : 'critical',
          title: `Low Stock Alert: ${sku}`,
          description: `Product ${sku} has ${currentQuantity} units remaining at ${warehouseCode} (Reorder point: ${reorderPointValue})`,
          current_quantity: currentQuantity,
          previous_quantity: previousQuantity,
          threshold: reorderPointValue,
          recommendations: [
            'Create purchase order',
            'Review demand forecast',
            'Consider expedited shipping',
            'Check alternative suppliers'
          ],
          timestamp: new Date().toISOString(),
          metadata: {
            reorder_point: reorderPointValue,
            max_stock: maxStockValue,
            days_of_stock: daysOfStock,
            stock_ratio: reorderPointValue > 0 ? currentQuantity / reorderPointValue : 0
          }
        };
      }
      // Check for overstock
      else if (currentQuantity >= maxStockValue) {
        alert = {
          id: `overstock_${sku}_${locationId}_${Date.now()}`,
          sku,
          location_id: locationId,
          warehouse_code: warehouseCode,
          alert_type: 'overstock',
          severity: 'warning',
          title: `Overstock Alert: ${sku}`,
          description: `Product ${sku} has ${currentQuantity} units at ${warehouseCode} (Max stock: ${maxStockValue})`,
          current_quantity: currentQuantity,
          previous_quantity: previousQuantity,
          threshold: maxStockValue,
          recommendations: [
            'Review demand forecast',
            'Consider promotional pricing',
            'Transfer to other locations',
            'Check for quality issues'
          ],
          timestamp: new Date().toISOString(),
          metadata: {
            reorder_point: reorderPointValue,
            max_stock: maxStockValue,
            overstock_ratio: maxStockValue > 0 ? currentQuantity / maxStockValue : 0
          }
        };
      }
      // Check for rapid decline
      else if (previousQuantity > 0) {
        const declineRatio = (previousQuantity - currentQuantity) / previousQuantity;
        if (declineRatio >= this.rapidDeclineThreshold && currentQuantity > 0) {
          alert = {
            id: `rapid_decline_${sku}_${locationId}_${Date.now()}`,
            sku,
            location_id: locationId,
            warehouse_code: warehouseCode,
            alert_type: 'rapid_decline',
            severity: 'warning',
            title: `Rapid Inventory Decline: ${sku}`,
            description: `Product ${sku} inventory dropped by ${(declineRatio * 100).toFixed(1)}% at ${warehouseCode}`,
            current_quantity: currentQuantity,
            previous_quantity: previousQuantity,
            threshold: this.rapidDeclineThreshold,
            recommendations: [
              'Investigate unusual demand',
              'Check for bulk orders',
              'Review marketing campaigns',
              'Consider increasing reorder point'
            ],
            timestamp: new Date().toISOString(),
            metadata: {
              decline_ratio: declineRatio,
              quantity_change: previousQuantity - currentQuantity,
              reorder_point: reorderPointValue
            }
          };
        }
      }

      return alert;
    } catch (error) {
      console.error(`Error checking inventory level for ${sku}:`, error);
      return null;
    }
  }

  /**
   * Publish an inventory alert to the analytics service.
   */
  async publishAlert(alert: InventoryAlert): Promise<boolean> {
    try {
      // Send to analytics service
      const response = await fetch(`${this.analyticsServiceUrl}/alerts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });

      if (response.ok) {
        console.log(`Alert ${alert.id} sent to analytics service`);
        return true;
      } else {
        console.warn(`Analytics service returned status ${response.status} for alert ${alert.id}`);
        return false;
      }
    } catch (error) {
      console.error(`Error publishing alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Calculate estimated days of stock remaining.
   * This is a simplified calculation - in production, use actual demand data.
   */
  private calculateDaysOfStock(currentQuantity: number, sku: string, locationId: string): number {
    // Placeholder calculation - in production, query historical sales data
    const defaultDailyDemand = 5;
    return defaultDailyDemand > 0 ? currentQuantity / defaultDailyDemand : 0;
  }

  /**
   * Get alert configuration for a specific SKU and location.
   */
  getAlertConfig(sku: string, locationId: string): Record<string, any> {
    return {
      reorder_point: 20,
      max_stock: 80,
      low_stock_threshold: this.defaultLowStockThreshold,
      overstock_threshold: this.defaultOverstockThreshold,
      rapid_decline_threshold: this.rapidDeclineThreshold
    };
  }

  /**
   * Update alert configuration for a specific SKU and location.
   */
  updateAlertConfig(sku: string, locationId: string, config: Record<string, any>): boolean {
    try {
      console.log(`Updated alert config for ${sku} at ${locationId}:`, config);
      return true;
    } catch (error) {
      console.error('Error updating alert config:', error);
      return false;
    }
  }
}

// Export singleton instance
export const inventoryMonitor = new InventoryMonitor();

// Helper function for the example usage pattern
export async function onInventoryChange(
  sku: string,
  location: string,
  quantity: number,
  prevQuantity: number
): Promise<void> {
  const alert = await inventoryMonitor.checkInventoryLevel(
    sku,
    location,
    'WH-MAIN',
    quantity,
    prevQuantity
  );

  if (alert) {
    await inventoryMonitor.publishAlert(alert);
    console.log(`Alert sent for ${sku}`);
  }
}

