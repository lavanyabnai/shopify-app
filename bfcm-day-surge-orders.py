# #!/usr/bin/env python3
# """
# BFCM Day Surge Order Generator
# Simulates Black Friday crisis with 300-500 orders focused on viral products
# Build on Session 1 baseline - does NOT clear existing data
# """

import sqlite3
import random
from datetime import datetime, timedelta
import uuid
import time

# BFCM Day: October 24, 2025
BFCM_DATE = datetime(2025, 10, 24, 0, 0, 0)

# Viral product focus (based on Session 1 baseline)
VIRAL_PRODUCTS = [
    {
        "id": "gid://shopify/Product/8891382710570",
        "title": "AirFlow Pro Wireless Earbuds",
        "sku": "AIRFLOW-PRO-001",
        "price": 79.99,
        "weight": 2.5  # High demand, stockout risk
    },
    {
        "id": "gid://shopify/Product/8891382743338",
        "title": "Premium Leather Phone Case",
        "sku": "CASE-LEATHER-001",
        "price": 34.99,
        "weight": 3.0  # Highest demand
    }
]

# Supporting products (moderate demand)
SUPPORTING_PRODUCTS = [
    {
        "id": "gid://shopify/Product/8891382776106",
        "title": "USB-C Fast Charging Cable",
        "sku": "CABLE-USBC-001",
        "price": 19.99,
        "weight": 1.5
    },
    {
        "id": "gid://shopify/Product/8891382808874",
        "title": "Wireless Charging Pad",
        "sku": "CHARGER-WIRELESS-001",
        "price": 29.99,
        "weight": 1.0
    },
    {
        "id": "gid://shopify/Product/8891382841642",
        "title": "Screen Protector Bundle",
        "sku": "SCREEN-PROTECT-001",
        "price": 24.99,
        "weight": 0.5
    }
]

def generate_orders(db_path: str, num_orders: int = 400):
    """Generate surge orders for BFCM day"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"\n🚀 BFCM Day Surge Order Generator")
    print(f"=" * 60)
    print(f"Target: {num_orders} orders on {BFCM_DATE.date()}")
    print(f"Strategy: Focus on viral products (70% of orders)")
    print(f"Peak velocity: 150-200 orders/hour during rush")
    print(f"\n⚠️  Building on Session 1 baseline (NOT clearing data)")
    print(f"=" * 60)

    # Check existing baseline
    cursor.execute('SELECT COUNT(*) FROM "Order"')
    existing_orders = cursor.fetchone()[0]
    print(f"\n📊 Existing baseline: {existing_orders} orders")

    orders_created = 0
    total_revenue = 0

    # Generate unique starting ID based on timestamp to avoid collisions
    base_id = int(time.time() * 1000)  # Millisecond timestamp

    # Generate orders throughout BFCM day (Oct 24, 2025)
    # Peak hours: 9am-1pm, 7pm-11pm
    for i in range(num_orders):
        # Distribute throughout the day with peak hours
        hour = random.choice([9, 10, 11, 12, 13, 19, 20, 21, 22, 23] * 3 + list(range(24)))
        minute = random.randint(0, 59)
        second = random.randint(0, 59)

        order_time = BFCM_DATE.replace(hour=hour, minute=minute, second=second)

        # 70% viral products, 30% supporting
        if random.random() < 0.7:
            product = random.choice(VIRAL_PRODUCTS)
        else:
            product = random.choice(SUPPORTING_PRODUCTS)

        # Quantity based on product popularity
        if product in VIRAL_PRODUCTS:
            quantity = random.choices([1, 2, 3, 4], weights=[0.4, 0.3, 0.2, 0.1])[0]
        else:
            quantity = random.choices([1, 2], weights=[0.7, 0.3])[0]

        order_id = f"gid://shopify/Order/{base_id + i}"
        shopify_order_id = str(base_id + i)
        order_name = f"#{10000 + existing_orders + i}"

        total = product["price"] * quantity
        total_revenue += total

        # Insert order
        cursor.execute("""
            INSERT INTO "Order" (
                id, shopifyOrderId, name, email, financialStatus, fulfillmentStatus,
                totalPrice, currency, createdAt, updatedAt, processedAt, shop
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id,
            shopify_order_id,
            order_name,
            f"bfcm-customer-{i}@example.com",
            "PAID",
            "UNFULFILLED",
            total,
            "USD",
            order_time.isoformat(),
            order_time.isoformat(),
            order_time.isoformat(),
            "test-shop.myshopify.com"
        ))

        # Insert line item
        line_item_id = f"cli_{uuid.uuid4().hex[:20]}"  # cuid-like format
        cursor.execute("""
            INSERT INTO "OrderLineItem" (
                id, orderId, productId, variantId, productTitle, quantity, price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            line_item_id,
            order_id,
            product["id"],
            f"{product['id']}/variant/1",
            product["title"],
            quantity,
            product["price"]
        ))

        orders_created += 1

        if (i + 1) % 50 == 0:
            print(f"  ⚡ Generated {i + 1}/{num_orders} orders...")

    conn.commit()

    # Calculate velocity metrics
    cursor.execute("""
        SELECT COUNT(*) FROM "Order"
        WHERE datetime(createdAt) >= datetime(?)
        AND datetime(createdAt) < datetime(?, '+1 day')
    """, (BFCM_DATE.isoformat(), BFCM_DATE.isoformat()))

    bfcm_orders = cursor.fetchone()[0]

    # Product distribution
    print(f"\n📦 Order Generation Complete!")
    print(f"=" * 60)
    print(f"✅ Created: {orders_created} new orders")
    print(f"💰 Revenue: ${total_revenue:,.2f}")
    print(f"📅 Date: {BFCM_DATE.date()}")
    print(f"🔥 Peak velocity: ~{bfcm_orders // 24} orders/hour average")

    print(f"\n📊 Product Distribution:")
    for product in VIRAL_PRODUCTS + SUPPORTING_PRODUCTS:
        cursor.execute("""
            SELECT COUNT(*), SUM(quantity)
            FROM "OrderLineItem"
            WHERE productId = ?
        """, (product["id"],))
        order_count, total_qty = cursor.fetchone()
        if order_count:
            print(f"  • {product['title']}: {order_count} orders, {total_qty} units")

    print(f"\n⚠️  Stockout Risk Assessment:")
    print(f"  • AirFlow Pro: HIGH (viral product, heavy volume)")
    print(f"  • Phone Case: CRITICAL (highest demand)")
    print(f"  • USB-C Cable: MODERATE")
    print(f"  • Charging Pad: LOW-MODERATE")
    print(f"  • Screen Protector: LOW")

    print(f"\n🎯 Next Steps:")
    print(f"  1. Run: npx tsx create-stockout-scenarios.ts")
    print(f"  2. Set critical inventory levels (0-10 units)")
    print(f"  3. Verify DEFCON escalation to 1-2")

    conn.close()

if __name__ == "__main__":
    import sys

    db_path = "prisma/dev.sqlite"
    num_orders = 400  # Default

    if len(sys.argv) > 1:
        num_orders = int(sys.argv[1])

    generate_orders(db_path, num_orders)
