"""
Inventory monitoring system with pub/sub capabilities for real-time inventory alerts.
Integrates with the existing analytics service to provide intelligent inventory management.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
import aiohttp
import redis
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertType(Enum):
    STOCKOUT = "stockout"
    LOW_STOCK = "low_stock"
    OVERSTOCK = "overstock"
    RAPID_DECLINE = "rapid_decline"
    UNUSUAL_ACTIVITY = "unusual_activity"

@dataclass
class InventoryAlert:
    """Represents an inventory alert with all necessary metadata."""
    id: str
    sku: str
    location_id: str
    warehouse_code: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    current_quantity: int
    previous_quantity: int
    threshold: Optional[float] = None
    recommendations: List[str] = None
    timestamp: str = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()
        if self.recommendations is None:
            self.recommendations = []
        if self.metadata is None:
            self.metadata = {}

class InventoryMonitor:
    """
    Monitors inventory levels and generates alerts based on configurable thresholds.
    Integrates with Redis for pub/sub messaging and the analytics service for processing.
    """
    
    def __init__(self, 
                 redis_url: str = "redis://localhost:6379",
                 analytics_service_url: str = "http://localhost:8000",
                 default_low_stock_threshold: float = 0.2,
                 default_overstock_threshold: float = 2.0,
                 rapid_decline_threshold: float = 0.5):
        """
        Initialize the inventory monitor.
        
        Args:
            redis_url: Redis connection URL for pub/sub
            analytics_service_url: URL of the analytics service
            default_low_stock_threshold: Default threshold for low stock alerts (as percentage of reorder point)
            default_overstock_threshold: Default threshold for overstock alerts (as multiple of reorder point)
            rapid_decline_threshold: Threshold for rapid decline alerts (percentage change)
        """
        self.redis_url = redis_url
        self.analytics_service_url = analytics_service_url
        self.default_low_stock_threshold = default_low_stock_threshold
        self.default_overstock_threshold = default_overstock_threshold
        self.rapid_decline_threshold = rapid_decline_threshold
        
        # Initialize Redis connection
        self.redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        
        # Channel names for pub/sub
        self.alert_channel = "inventory_alerts"
        self.inventory_updates_channel = "inventory_updates"
        
        logger.info(f"InventoryMonitor initialized with Redis: {redis_url}")

    async def check_inventory_level(self, 
                                  sku: str, 
                                  location_id: str, 
                                  warehouse_code: str,
                                  current_quantity: int, 
                                  previous_quantity: int,
                                  reorder_point: Optional[int] = None,
                                  max_stock: Optional[int] = None) -> Optional[InventoryAlert]:
        """
        Check inventory level and generate alerts if thresholds are breached.
        
        Args:
            sku: Product SKU
            location_id: Location identifier
            warehouse_code: Warehouse code
            current_quantity: Current inventory quantity
            previous_quantity: Previous inventory quantity
            reorder_point: Reorder point for this SKU (optional)
            max_stock: Maximum stock level for this SKU (optional)
            
        Returns:
            InventoryAlert if threshold breached, None otherwise
        """
        try:
            # Set default values if not provided
            if reorder_point is None:
                reorder_point = 20  # Default reorder point
            if max_stock is None:
                max_stock = reorder_point * 4  # Default max stock
            
            alerts = []
            
            # Check for stockout
            if current_quantity == 0:
                alert = InventoryAlert(
                    id=f"stockout_{sku}_{location_id}_{datetime.now().timestamp()}",
                    sku=sku,
                    location_id=location_id,
                    warehouse_code=warehouse_code,
                    alert_type=AlertType.STOCKOUT,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Out of Stock: {sku}",
                    description=f"Product {sku} is completely out of stock at {warehouse_code}",
                    current_quantity=current_quantity,
                    previous_quantity=previous_quantity,
                    threshold=0.0,
                    recommendations=[
                        "Create emergency purchase order",
                        "Transfer from other locations",
                        "Notify customers of potential delays",
                        "Check for pending orders"
                    ],
                    metadata={
                        "reorder_point": reorder_point,
                        "max_stock": max_stock,
                        "days_of_stock": 0
                    }
                )
                alerts.append(alert)
            
            # Check for low stock
            elif current_quantity <= reorder_point:
                days_of_stock = self._calculate_days_of_stock(current_quantity, sku, location_id)
                alert = InventoryAlert(
                    id=f"low_stock_{sku}_{location_id}_{datetime.now().timestamp()}",
                    sku=sku,
                    location_id=location_id,
                    warehouse_code=warehouse_code,
                    alert_type=AlertType.LOW_STOCK,
                    severity=AlertSeverity.WARNING if current_quantity > 0 else AlertSeverity.CRITICAL,
                    title=f"Low Stock Alert: {sku}",
                    description=f"Product {sku} has {current_quantity} units remaining at {warehouse_code} (Reorder point: {reorder_point})",
                    current_quantity=current_quantity,
                    previous_quantity=previous_quantity,
                    threshold=reorder_point,
                    recommendations=[
                        "Create purchase order",
                        "Review demand forecast",
                        "Consider expedited shipping",
                        "Check alternative suppliers"
                    ],
                    metadata={
                        "reorder_point": reorder_point,
                        "max_stock": max_stock,
                        "days_of_stock": days_of_stock,
                        "stock_ratio": current_quantity / reorder_point if reorder_point > 0 else 0
                    }
                )
                alerts.append(alert)
            
            # Check for overstock
            elif current_quantity >= max_stock:
                alert = InventoryAlert(
                    id=f"overstock_{sku}_{location_id}_{datetime.now().timestamp()}",
                    sku=sku,
                    location_id=location_id,
                    warehouse_code=warehouse_code,
                    alert_type=AlertType.OVERSTOCK,
                    severity=AlertSeverity.WARNING,
                    title=f"Overstock Alert: {sku}",
                    description=f"Product {sku} has {current_quantity} units at {warehouse_code} (Max stock: {max_stock})",
                    current_quantity=current_quantity,
                    previous_quantity=previous_quantity,
                    threshold=max_stock,
                    recommendations=[
                        "Review demand forecast",
                        "Consider promotional pricing",
                        "Transfer to other locations",
                        "Check for quality issues"
                    ],
                    metadata={
                        "reorder_point": reorder_point,
                        "max_stock": max_stock,
                        "overstock_ratio": current_quantity / max_stock if max_stock > 0 else 0
                    }
                )
                alerts.append(alert)
            
            # Check for rapid decline
            if previous_quantity > 0:
                decline_ratio = (previous_quantity - current_quantity) / previous_quantity
                if decline_ratio >= self.rapid_decline_threshold and current_quantity > 0:
                    alert = InventoryAlert(
                        id=f"rapid_decline_{sku}_{location_id}_{datetime.now().timestamp()}",
                        sku=sku,
                        location_id=location_id,
                        warehouse_code=warehouse_code,
                        alert_type=AlertType.RAPID_DECLINE,
                        severity=AlertSeverity.WARNING,
                        title=f"Rapid Inventory Decline: {sku}",
                        description=f"Product {sku} inventory dropped by {decline_ratio:.1%} at {warehouse_code}",
                        current_quantity=current_quantity,
                        previous_quantity=previous_quantity,
                        threshold=self.rapid_decline_threshold,
                        recommendations=[
                            "Investigate unusual demand",
                            "Check for bulk orders",
                            "Review marketing campaigns",
                            "Consider increasing reorder point"
                        ],
                        metadata={
                            "decline_ratio": decline_ratio,
                            "quantity_change": previous_quantity - current_quantity,
                            "reorder_point": reorder_point
                        }
                    )
                    alerts.append(alert)
            
            # Return the most critical alert if multiple alerts are generated
            if alerts:
                # Prioritize by severity: CRITICAL > WARNING > INFO
                severity_order = {AlertSeverity.CRITICAL: 3, AlertSeverity.WARNING: 2, AlertSeverity.INFO: 1}
                return max(alerts, key=lambda x: severity_order[x.severity])
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking inventory level for {sku}: {str(e)}")
            return None

    def _calculate_days_of_stock(self, current_quantity: int, sku: str, location_id: str) -> float:
        """
        Calculate estimated days of stock remaining based on historical demand.
        This is a simplified calculation - in production, you'd use actual demand data.
        """
        # This is a placeholder calculation. In production, you'd:
        # 1. Query historical sales data for this SKU
        # 2. Calculate average daily demand
        # 3. Return current_quantity / average_daily_demand
        
        # For now, assume a default daily demand of 5 units
        default_daily_demand = 5
        return current_quantity / default_daily_demand if default_daily_demand > 0 else 0

    async def publish_alert(self, alert: InventoryAlert) -> bool:
        """
        Publish an inventory alert to the Redis pub/sub channel.
        
        Args:
            alert: The inventory alert to publish
            
        Returns:
            True if published successfully, False otherwise
        """
        try:
            # Convert alert to dictionary for JSON serialization
            alert_data = asdict(alert)
            alert_data['alert_type'] = alert.alert_type.value
            alert_data['severity'] = alert.severity.value
            
            # Publish to Redis
            self.redis_client.publish(self.alert_channel, json.dumps(alert_data))
            
            # Also send to analytics service for processing
            await self._send_to_analytics_service(alert_data)
            
            logger.info(f"Published alert {alert.id} for SKU {alert.sku}")
            return True
            
        except Exception as e:
            logger.error(f"Error publishing alert {alert.id}: {str(e)}")
            return False

    async def _send_to_analytics_service(self, alert_data: Dict[str, Any]) -> None:
        """
        Send alert data to the analytics service for further processing.
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.analytics_service_url}/alerts/process",
                    json=alert_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        logger.info(f"Alert {alert_data['id']} sent to analytics service")
                    else:
                        logger.warning(f"Analytics service returned status {response.status} for alert {alert_data['id']}")
        except Exception as e:
            logger.error(f"Error sending alert to analytics service: {str(e)}")

    async def subscribe_to_alerts(self, callback) -> None:
        """
        Subscribe to inventory alerts from the Redis pub/sub channel.
        
        Args:
            callback: Function to call when an alert is received
        """
        try:
            pubsub = self.redis_client.pubsub()
            pubsub.subscribe(self.alert_channel)
            
            logger.info(f"Subscribed to alerts on channel: {self.alert_channel}")
            
            for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        alert_data = json.loads(message['data'])
                        await callback(alert_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Error decoding alert message: {str(e)}")
                    except Exception as e:
                        logger.error(f"Error processing alert: {str(e)}")
                        
        except Exception as e:
            logger.error(f"Error subscribing to alerts: {str(e)}")

    async def publish_inventory_update(self, sku: str, location_id: str, 
                                     warehouse_code: str, quantity: int) -> None:
        """
        Publish inventory update to the Redis pub/sub channel.
        
        Args:
            sku: Product SKU
            location_id: Location identifier
            warehouse_code: Warehouse code
            quantity: New inventory quantity
        """
        try:
            update_data = {
                "sku": sku,
                "location_id": location_id,
                "warehouse_code": warehouse_code,
                "quantity": quantity,
                "timestamp": datetime.now().isoformat()
            }
            
            self.redis_client.publish(self.inventory_updates_channel, json.dumps(update_data))
            logger.info(f"Published inventory update for {sku} at {warehouse_code}: {quantity}")
            
        except Exception as e:
            logger.error(f"Error publishing inventory update: {str(e)}")

    def get_alert_config(self, sku: str, location_id: str) -> Dict[str, Any]:
        """
        Get alert configuration for a specific SKU and location.
        In production, this would query a database for custom thresholds.
        """
        # This is a placeholder - in production, you'd store this in a database
        return {
            "reorder_point": 20,
            "max_stock": 80,
            "low_stock_threshold": self.default_low_stock_threshold,
            "overstock_threshold": self.default_overstock_threshold,
            "rapid_decline_threshold": self.rapid_decline_threshold
        }

    def update_alert_config(self, sku: str, location_id: str, config: Dict[str, Any]) -> bool:
        """
        Update alert configuration for a specific SKU and location.
        In production, this would update a database.
        """
        try:
            # This is a placeholder - in production, you'd update a database
            logger.info(f"Updated alert config for {sku} at {location_id}: {config}")
            return True
        except Exception as e:
            logger.error(f"Error updating alert config: {str(e)}")
            return False

# Example usage and testing
async def example_usage():
    """Example of how to use the InventoryMonitor class."""
    
    # Initialize monitor
    monitor = InventoryMonitor()
    
    # Example inventory change
    def on_inventory_change(sku, location, quantity, prev_quantity):
        alert = monitor.check_inventory_level(
            sku=sku,
            location_id=location,
            warehouse_code="WH-MAIN",
            current_quantity=quantity,
            previous_quantity=prev_quantity
        )
        
        if alert:
            monitor.publish_alert(alert)
            print(f"Alert sent for {sku}")
    
    # Test with different scenarios
    test_cases = [
        ("SKU-001", "LOC-001", 0, 15),      # Stockout
        ("SKU-002", "LOC-001", 5, 25),      # Low stock
        ("SKU-003", "LOC-001", 100, 80),    # Overstock
        ("SKU-004", "LOC-001", 10, 30),     # Rapid decline
    ]
    
    for sku, location, quantity, prev_quantity in test_cases:
        await on_inventory_change(sku, location, quantity, prev_quantity)

if __name__ == "__main__":
    asyncio.run(example_usage())

