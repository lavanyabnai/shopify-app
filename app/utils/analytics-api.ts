/**
 * Analytics API Integration Helper
 * Connects Shopify app to FastAPI backend
 */

const API_BASE_URL = process.env.ANALYTICS_API_URL || 'http://localhost:8000';

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric?: string;
  threshold?: number;
  current_value?: number;
  recommendations: string[];
  timestamp: string;
}

export interface ForecastResult {
  product_id: string;
  method: string;
  trend?: string;
  forecast: Array<{
    date: string;
    value: number;
    lower_bound: number;
    upper_bound: number;
  }>;
  metrics: {
    average?: number;
    min?: number;
    max?: number;
  };
}

export interface InventoryItem {
  sku: string;
  product_name: string;
  available: number;
  reorder_point: number;
  location: string;
  monthly_demand: number;
}

class AnalyticsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check API health
   */
  async health(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Generate alerts based on inventory data
   */
  async generateAlerts(inventory: InventoryItem[]): Promise<{
    alerts: Alert[];
    summary: {
      total: number;
      critical: number;
      warning: number;
      info: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/alerts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inventory }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate alerts: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate forecast for a product
   */
  async generateForecast(
    productId: string,
    historicalData: Array<{ quantity: number }>,
    periods: number = 30
  ): Promise<ForecastResult> {
    const response = await fetch(`${this.baseUrl}/analytics/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        historical_data: historicalData,
        periods,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate forecast: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Analyze trend in time series data
   */
  async analyzeTrend(values: number[]): Promise<{
    trend: string;
    average: number;
    growth_rate: number;
    last_value: number;
    peak: number;
    trough: number;
  }> {
    const response = await fetch(`${this.baseUrl}/analytics/trend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze trend: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Detect anomalies in data
   */
  async detectAnomalies(values: number[]): Promise<{
    total_points: number;
    anomaly_count: number;
    anomalies: Array<{
      index: number;
      value: number;
      deviation: number;
    }>;
    anomaly_rate: number;
  }> {
    const response = await fetch(`${this.baseUrl}/analytics/anomalies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      throw new Error(`Failed to detect anomalies: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Calculate optimal reorder point
   */
  async calculateReorderPoint(params: {
    daily_demand: number;
    lead_time_days: number;
    service_level?: number;
    demand_std?: number;
    ordering_cost?: number;
    holding_cost?: number;
  }): Promise<{
    reorder_point: number;
    safety_stock: number;
    economic_order_quantity: number;
    recommendations: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/optimization/reorder-point`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate reorder point: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const analyticsAPI = new AnalyticsAPI();

// Helper function to transform Shopify inventory data
export function transformShopifyInventory(shopifyData: any[]): InventoryItem[] {
  return shopifyData.map(item => ({
    sku: item.sku || item.id,
    product_name: item.title || 'Unknown Product',
    available: item.inventoryQuantity || 0,
    reorder_point: 20, // Default, should be configurable
    location: item.location?.name || 'Default',
    monthly_demand: 30, // Default, should be calculated from sales data
  }));
}

// Helper function to prepare historical data for forecasting
export function prepareHistoricalData(orders: any[]): Array<{ quantity: number }> {
  // Group orders by day and sum quantities
  const dailyData = new Map<string, number>();
  
  orders.forEach(order => {
    const date = new Date(order.createdAt).toDateString();
    const quantity = order.lineItems?.reduce((sum: number, item: any) => 
      sum + (item.quantity || 0), 0) || 0;
    
    dailyData.set(date, (dailyData.get(date) || 0) + quantity);
  });
  
  return Array.from(dailyData.values()).map(quantity => ({ quantity }));
}