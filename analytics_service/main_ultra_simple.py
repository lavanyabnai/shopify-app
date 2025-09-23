"""
Ultra Simple FastAPI Analytics Service - No complex dependencies
Works with any Python 3.8+
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import json
import statistics
import random
from enum import Enum

app = FastAPI(
    title="Supply Chain Analytics API",
    description="Simplified analytics for Shopify supply chain",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Data Models ====================

class Alert(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    description: str
    metric: Optional[str] = None
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    recommendations: List[str] = []
    timestamp: str

class InventoryItem(BaseModel):
    sku: str
    product_name: str
    available: int
    reorder_point: int = 10
    location: str = "default"
    monthly_demand: float = 30

class ForecastRequest(BaseModel):
    product_id: str
    historical_data: List[Dict[str, Any]]
    periods: int = 30

# ==================== Helper Functions ====================

def calculate_moving_average(values: List[float], window: int = 7) -> float:
    """Calculate simple moving average"""
    if not values:
        return 0
    window = min(window, len(values))
    recent_values = values[-window:]
    return sum(recent_values) / len(recent_values)

def calculate_trend(values: List[float]) -> str:
    """Determine if trend is up, down, or stable"""
    if len(values) < 2:
        return "stable"
    
    recent = sum(values[-3:]) / min(3, len(values[-3:]))
    older = sum(values[:-3]) / max(1, len(values[:-3]))
    
    if recent > older * 1.1:
        return "increasing"
    elif recent < older * 0.9:
        return "decreasing"
    return "stable"

def detect_anomalies_simple(values: List[float]) -> List[int]:
    """Simple anomaly detection using standard deviation"""
    if len(values) < 3:
        return []
    
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    std_dev = variance ** 0.5
    
    anomalies = []
    for i, value in enumerate(values):
        if abs(value - mean) > 2.5 * std_dev:
            anomalies.append(i)
    
    return anomalies

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    return {
        "name": "Supply Chain Analytics API (Simple)",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/health",
            "/analytics/forecast",
            "/analytics/trend",
            "/analytics/anomalies",
            "/alerts/generate",
            "/optimization/reorder-point"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "python_version": "3.8+",
        "dependencies": "minimal"
    }

@app.post("/analytics/forecast")
async def generate_forecast(request: ForecastRequest):
    """Generate simple forecast using moving average"""
    try:
        # Extract historical values
        values = []
        for item in request.historical_data:
            if isinstance(item, dict):
                values.append(float(item.get('quantity', 0)))
            else:
                values.append(float(item))
        
        if not values:
            values = [10]  # Default value
        
        # Calculate moving average
        avg = calculate_moving_average(values, 7)
        trend = calculate_trend(values)
        
        # Generate forecast
        forecast = []
        base_date = datetime.now()
        
        for i in range(request.periods):
            # Add some variation
            if trend == "increasing":
                value = avg * (1 + i * 0.01) * random.uniform(0.95, 1.05)
            elif trend == "decreasing":
                value = avg * (1 - i * 0.01) * random.uniform(0.95, 1.05)
            else:
                value = avg * random.uniform(0.95, 1.05)
            
            forecast.append({
                "date": (base_date + timedelta(days=i+1)).isoformat(),
                "value": round(value, 2),
                "lower_bound": round(value * 0.8, 2),
                "upper_bound": round(value * 1.2, 2)
            })
        
        return {
            "product_id": request.product_id,
            "method": "moving_average",
            "trend": trend,
            "forecast": forecast,
            "metrics": {
                "average": round(avg, 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/trend")
async def analyze_trend(data: Dict[str, Any]):
    """Analyze trend in time series data"""
    try:
        time_series = data.get('values', [])
        
        if not time_series:
            return {"error": "No data provided"}
        
        # Convert to float values
        values = [float(v) for v in time_series]
        
        trend = calculate_trend(values)
        avg = sum(values) / len(values)
        
        # Calculate growth rate
        if len(values) >= 2:
            growth = ((values[-1] - values[0]) / values[0]) * 100 if values[0] != 0 else 0
        else:
            growth = 0
        
        return {
            "trend": trend,
            "average": round(avg, 2),
            "growth_rate": round(growth, 2),
            "last_value": round(values[-1], 2) if values else 0,
            "peak": round(max(values), 2),
            "trough": round(min(values), 2)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/anomalies")
async def detect_anomalies(data: Dict[str, Any]):
    """Detect anomalies in data"""
    try:
        values = [float(v) for v in data.get('values', [])]
        
        if len(values) < 3:
            return {
                "message": "Need at least 3 data points for anomaly detection",
                "anomalies": []
            }
        
        anomaly_indices = detect_anomalies_simple(values)
        
        anomalies = []
        for idx in anomaly_indices:
            anomalies.append({
                "index": idx,
                "value": values[idx],
                "deviation": abs(values[idx] - sum(values)/len(values))
            })
        
        return {
            "total_points": len(values),
            "anomaly_count": len(anomalies),
            "anomalies": anomalies,
            "anomaly_rate": len(anomalies) / len(values) if values else 0
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/generate")
async def generate_alerts(data: Dict[str, Any]):
    """Generate alerts based on inventory data"""
    try:
        alerts = []
        inventory = data.get('inventory', [])
        
        for idx, item_data in enumerate(inventory):
            item = InventoryItem(**item_data) if isinstance(item_data, dict) else item_data
            
            alert_id = f"{item.sku}_{datetime.now().timestamp()}"
            
            # Out of stock
            if item.available == 0:
                alerts.append(Alert(
                    id=f"oos_{alert_id}",
                    type="stockout",
                    severity="critical",
                    title=f"Out of Stock: {item.product_name}",
                    description=f"Product {item.product_name} is completely out of stock at {item.location}",
                    metric="inventory",
                    threshold=0.0,
                    current_value=0.0,
                    recommendations=[
                        "Create emergency purchase order",
                        "Transfer from other locations",
                        "Notify customers"
                    ],
                    timestamp=datetime.now().isoformat()
                ))
            
            # Low stock
            elif item.available < item.reorder_point:
                alerts.append(Alert(
                    id=f"low_{alert_id}",
                    type="low_stock",
                    severity="warning",
                    title=f"Low Stock: {item.product_name}",
                    description=f"Only {item.available} units left (below reorder point of {item.reorder_point})",
                    metric="inventory",
                    threshold=float(item.reorder_point),
                    current_value=float(item.available),
                    recommendations=[
                        f"Order {int(item.monthly_demand * 2)} units",
                        "Review demand forecast",
                        "Check supplier lead times"
                    ],
                    timestamp=datetime.now().isoformat()
                ))
            
            # Overstock
            elif item.available > item.monthly_demand * 6:
                alerts.append(Alert(
                    id=f"over_{alert_id}",
                    type="overstock",
                    severity="info",
                    title=f"Overstock: {item.product_name}",
                    description=f"Excess inventory: {item.available} units (>{6} months supply)",
                    metric="months_supply",
                    threshold=6.0,
                    current_value=item.available / item.monthly_demand if item.monthly_demand > 0 else 999,
                    recommendations=[
                        "Run promotion",
                        "Transfer to other locations",
                        "Reduce future orders"
                    ],
                    timestamp=datetime.now().isoformat()
                ))
        
        return {
            "alerts": [alert.dict() for alert in alerts],
            "summary": {
                "total": len(alerts),
                "critical": len([a for a in alerts if a.severity == "critical"]),
                "warning": len([a for a in alerts if a.severity == "warning"]),
                "info": len([a for a in alerts if a.severity == "info"])
            },
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimization/reorder-point")
async def calculate_reorder_point(data: Dict[str, Any]):
    """Calculate optimal reorder point"""
    try:
        daily_demand = data.get('daily_demand', 10)
        lead_time_days = data.get('lead_time_days', 5)
        service_level = data.get('service_level', 0.95)
        demand_variability = data.get('demand_std', 3)
        
        # Basic reorder point formula
        average_demand_during_lead = daily_demand * lead_time_days
        
        # Safety stock calculation (simplified)
        # Z-score approximation for service levels
        z_scores = {
            0.90: 1.28,
            0.95: 1.65,
            0.99: 2.33
        }
        z = z_scores.get(service_level, 1.65)
        
        safety_stock = z * demand_variability * (lead_time_days ** 0.5)
        reorder_point = average_demand_during_lead + safety_stock
        
        # Economic order quantity (simplified)
        ordering_cost = data.get('ordering_cost', 50)
        holding_cost = data.get('holding_cost', 2)
        annual_demand = daily_demand * 365
        
        if holding_cost > 0:
            eoq = (2 * annual_demand * ordering_cost / holding_cost) ** 0.5
        else:
            eoq = daily_demand * 30  # Default to monthly demand
        
        return {
            "reorder_point": round(reorder_point, 0),
            "safety_stock": round(safety_stock, 0),
            "economic_order_quantity": round(eoq, 0),
            "average_demand": daily_demand,
            "lead_time": lead_time_days,
            "service_level": service_level,
            "recommendations": [
                f"Set reorder point to {int(reorder_point)} units",
                f"Maintain safety stock of {int(safety_stock)} units",
                f"Order {int(eoq)} units per order for optimal cost"
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)