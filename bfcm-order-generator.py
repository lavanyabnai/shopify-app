#!/usr/bin/env python3
"""
BFCM Pre-Event Order Generator (October 1-23, 2025)
Generates realistic baseline data with velocity patterns for War Room testing

Features:
- Progressive velocity increase (20 → 40 → 80 orders/day)
- Product-specific velocity profiles (viral, steady, slow)
- Repeat customer simulation
- Time-of-day patterns
- Category surge patterns
"""

import random
import requests
from datetime import datetime, timedelta
import json
import time
import os
from dotenv import load_dotenv
import sys
from collections import defaultdict

load_dotenv()

SHOP_DOMAIN = os.getenv('SHOP_DOMAIN')
ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
API_VERSION = os.getenv('API_VERSION', '2024-01')

if not SHOP_DOMAIN or not ACCESS_TOKEN:
    print("❌ Error: Missing SHOP_DOMAIN or ACCESS_TOKEN in .env file")
    sys.exit(1)

BASE_URL = f"https://{SHOP_DOMAIN}/admin/api/{API_VERSION}"
headers = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

# ============================================================================
# BFCM Configuration
# ============================================================================

# Date range: Oct 1-23, 2025 (23 days before BFCM)
START_DATE = datetime(2025, 10, 1)
END_DATE = datetime(2025, 10, 23, 23, 59, 59)

# Velocity progression (orders per day)
VELOCITY_SCHEDULE = {
    # Week 1 (Oct 1-7): Baseline
    (1, 7): {'base': 20, 'variation': 5},
    # Week 2 (Oct 8-14): Ramp up
    (8, 14): {'base': 35, 'variation': 8},
    # Week 3 (Oct 15-21): Pre-BFCM surge
    (15, 21): {'base': 60, 'variation': 15},
    # Final days (Oct 22-23): Peak preparation
    (22, 23): {'base': 80, 'variation': 20},
}

# Product velocity profiles (simulates real BFCM patterns)
PRODUCT_VELOCITY_PROFILES = {
    # Viral products (will be critical on BFCM)
    'viral': {
        'keywords': ['AirFlow', 'Phone Case Premium', 'Earbuds'],
        'week1_multiplier': 1.0,   # Normal
        'week2_multiplier': 1.5,   # Starting to trend
        'week3_multiplier': 3.0,   # Viral on social media
        'final_multiplier': 4.0,   # Peak before BFCM
    },
    # Steady sellers
    'steady': {
        'keywords': ['Yoga Mat', 'Coffee', 'Mug', 'Water Bottle', 'Notebook'],
        'week1_multiplier': 1.0,
        'week2_multiplier': 1.2,
        'week3_multiplier': 1.5,
        'final_multiplier': 1.8,
    },
    # Slow movers (will have dead stock)
    'slow': {
        'keywords': ['Winter Jacket'],
        'week1_multiplier': 0.5,
        'week2_multiplier': 0.3,
        'week3_multiplier': 0.2,
        'final_multiplier': 0.2,
    },
}

# Time-of-day distribution (realistic shopping patterns)
HOURLY_DISTRIBUTION = {
    # Hour range: weight
    (0, 7): 0.1,    # Night: 10%
    (8, 11): 0.8,   # Morning: 80%
    (12, 14): 1.5,  # Lunch: 150%
    (15, 17): 1.2,  # Afternoon: 120%
    (18, 20): 2.0,  # Evening peak: 200%
    (21, 23): 0.7,  # Late: 70%
}

# Day-of-week patterns
DOW_MULTIPLIER = {
    0: 0.8,  # Monday
    1: 0.9,  # Tuesday
    2: 1.0,  # Wednesday
    3: 1.1,  # Thursday
    4: 1.3,  # Friday
    5: 1.5,  # Saturday
    6: 1.2,  # Sunday
}

# Repeat customer rate
REPEAT_CUSTOMER_RATE = 0.25  # 25% repeat customers

# ============================================================================
# Global tracking
# ============================================================================

total_success = 0
total_failed = 0
failed_reasons = {}
weekly_stats = defaultdict(lambda: {'success': 0, 'failed': 0, 'days': 0})
customer_database = []  # Track customers for repeats

# ============================================================================
# Helper Functions
# ============================================================================

def get_week_number(date):
    """Get week number (1-4) for Oct 2025"""
    day = date.day
    if day <= 7:
        return 1
    elif day <= 14:
        return 2
    elif day <= 21:
        return 3
    else:
        return 4

def get_velocity_config(date):
    """Get velocity configuration for a specific date"""
    day = date.day
    for (start, end), config in VELOCITY_SCHEDULE.items():
        if start <= day <= end:
            return config
    return {'base': 20, 'variation': 5}

def get_product_multiplier(product_title, date):
    """Get velocity multiplier for a product based on date"""
    week = get_week_number(date)

    # Check each profile
    for profile_name, profile in PRODUCT_VELOCITY_PROFILES.items():
        for keyword in profile['keywords']:
            if keyword.lower() in product_title.lower():
                # Return multiplier based on week
                if week == 1:
                    return profile['week1_multiplier']
                elif week == 2:
                    return profile['week2_multiplier']
                elif week == 3:
                    return profile['week3_multiplier']
                else:
                    return profile['final_multiplier']

    # Default: steady profile
    if week == 1:
        return 1.0
    elif week == 2:
        return 1.2
    elif week == 3:
        return 1.5
    else:
        return 1.8

def get_hour_multiplier(hour):
    """Get multiplier for time of day"""
    for (start, end), multiplier in HOURLY_DISTRIBUTION.items():
        if start <= hour <= end:
            return multiplier
    return 1.0

def get_product_variants():
    """Get valid product variants from store"""
    print("🔍 Fetching product variants...")

    try:
        response = requests.get(
            f"{BASE_URL}/products.json?limit=250",
            headers=headers
        )
        response.raise_for_status()
        products = response.json()['products']

        variant_map = {}
        for product in products:
            for variant in product['variants']:
                key = f"{product['title']} - {variant['title']}"
                variant_map[key] = {
                    'id': variant['id'],
                    'price': variant['price'],
                    'sku': variant.get('sku', ''),
                    'product_title': product['title'],
                    'variant_title': variant['title'],
                    'product_id': product['id']
                }

        print(f"✅ Found {len(variant_map)} variants from {len(products)} products\n")
        return variant_map, products

    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch products: {e}")
        sys.exit(1)

def select_weighted_variants(variant_list, products_data, date, count):
    """Select variants with velocity-based weighting"""
    weighted_variants = []

    for variant_key, variant_data in variant_list.items():
        multiplier = get_product_multiplier(variant_data['product_title'], date)
        # Add variant multiple times based on multiplier
        weight = max(1, int(multiplier * 10))
        weighted_variants.extend([variant_data] * weight)

    # Random selection from weighted list
    selected = []
    for _ in range(count):
        if weighted_variants:
            selected.append(random.choice(weighted_variants))

    return selected

def create_customer_data(order_number, is_repeat=False):
    """Create customer data (new or repeat)"""
    if is_repeat and customer_database:
        # Use existing customer
        customer = random.choice(customer_database)
        return customer

    # Create new customer
    first_names = ["Raj", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Arjun", "Kavya",
                   "Rohan", "Diya", "Karan", "Ishita", "Aditya", "Meera"]
    last_names = ["Kumar", "Sharma", "Patel", "Singh", "Gupta", "Verma", "Reddy", "Nair"]

    first_name = random.choice(first_names)
    last_name = random.choice(last_names)

    cities = [
        ("Mumbai", "Maharashtra", "400001"),
        ("Delhi", "Delhi", "110001"),
        ("Bangalore", "Karnataka", "560001"),
        ("Chennai", "Tamil Nadu", "600002"),
        ("Pune", "Maharashtra", "411001"),
        ("Hyderabad", "Telangana", "500001"),
    ]
    city, province, zip_code = random.choice(cities)

    customer = {
        "first_name": first_name,
        "last_name": last_name,
        "email": f"{first_name.lower()}.{last_name.lower()}{order_number}@bfcm.test",
        "city": city,
        "province": province,
        "zip": zip_code
    }

    # Add to database (limit to 1000 customers)
    if len(customer_database) < 1000:
        customer_database.append(customer)

    return customer

def create_order(date, items, order_number, is_dev_store=True):
    """Create a single order"""
    global total_success, total_failed, failed_reasons

    # Determine if repeat customer
    is_repeat = random.random() < REPEAT_CUSTOMER_RATE
    customer = create_customer_data(order_number, is_repeat)

    # Build order
    order_data = {
        "order": {
            "line_items": items,
            "customer": {
                "first_name": customer["first_name"],
                "last_name": customer["last_name"],
                "email": customer["email"]
            },
            "email": customer["email"],
            "financial_status": "paid",
            "fulfillment_status": "fulfilled" if (datetime.now() - date).days > 7 else "unfulfilled",
            "processed_at": date.isoformat(),
            "test": True,
            "tags": f"bfcm-test,pre-event,week{get_week_number(date)},{date.strftime('%Y-%m')}",
            "shipping_address": {
                "first_name": customer["first_name"],
                "last_name": customer["last_name"],
                "address1": f"{random.randint(1, 999)} Main Street",
                "city": customer["city"],
                "province": customer["province"],
                "country": "India",
                "zip": customer["zip"]
            }
        }
    }

    try:
        response = requests.post(
            f"{BASE_URL}/orders.json",
            headers=headers,
            json=order_data
        )

        if response.status_code == 201:
            total_success += 1
            return True
        elif response.status_code == 429:
            # Rate limit hit - wait and retry once
            time.sleep(2)
            total_failed += 1
            failed_reasons[429] = failed_reasons.get(429, 0) + 1
            return False
        else:
            total_failed += 1
            failed_reasons[response.status_code] = failed_reasons.get(response.status_code, 0) + 1
            return False

    except Exception as e:
        total_failed += 1
        return False

# ============================================================================
# Main Generation Logic
# ============================================================================

def generate_bfcm_baseline_orders(is_dev_store=True):
    """Generate Oct 1-23, 2025 baseline orders with BFCM patterns"""

    # Get variants
    variants, products = get_product_variants()
    if not variants:
        print("❌ No variants found")
        return

    # Calculate totals
    total_days = (END_DATE - START_DATE).days + 1

    print("=" * 70)
    print("🎃 BFCM PRE-EVENT ORDER GENERATOR")
    print("=" * 70)
    print(f"Period        : Oct 1-23, 2025 ({total_days} days)")
    print(f"Pattern       : Progressive velocity increase")
    print(f"  Week 1      : ~20 orders/day (baseline)")
    print(f"  Week 2      : ~35 orders/day (ramp up)")
    print(f"  Week 3      : ~60 orders/day (pre-BFCM surge)")
    print(f"  Final 2 days: ~80 orders/day (peak preparation)")
    print(f"Est. Orders   : ~1,100 total")
    print(f"Rate Limit    : {'Dev Store (5/min)' if is_dev_store else 'Production'}")
    print("=" * 70)

    response = input("\n▶️  Start generating baseline orders? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("\n❌ Order generation cancelled\n")
        return

    current_date = START_DATE
    order_counter = 1

    # Dev store batch tracking
    if is_dev_store:
        orders_this_minute = 0
        minute_start = time.time()

    # Track current week
    current_week = None
    week_start_success = 0
    week_start_failed = 0

    print("\n" + "=" * 70)
    print("📊 PROGRESS")
    print("=" * 70 + "\n")

    while current_date <= END_DATE:
        week = get_week_number(current_date)
        week_key = f"Week {week}"

        # Print week header
        if current_week != week:
            if current_week is not None:
                week_success = total_success - week_start_success
                week_failed = total_failed - week_start_failed
                week_total = week_success + week_failed
                print(f"\n   └─ {current_week} Total: {week_total} orders (✅ {week_success} | ❌ {week_failed})\n")

            current_week = week_key
            week_start_success = total_success
            week_start_failed = total_failed

            print("─" * 70)
            print(f"📅 WEEK {week} - {current_date.strftime('%B %d-%d')}")
            print("─" * 70)

        # Get velocity config for this date
        velocity_config = get_velocity_config(current_date)
        daily_base = velocity_config['base']
        daily_variation = random.randint(-velocity_config['variation'], velocity_config['variation'])
        daily_count = max(5, daily_base + daily_variation)

        # Apply day-of-week multiplier
        dow_mult = DOW_MULTIPLIER.get(current_date.weekday(), 1.0)
        daily_count = int(daily_count * dow_mult)

        # Update weekly stats
        weekly_stats[week_key]['days'] += 1

        # Format date output
        date_str = current_date.strftime('%d %a')
        print(f"   {date_str} │ ", end="", flush=True)

        daily_success = 0
        daily_failed = 0

        for i in range(daily_count):
            # Handle dev store rate limits
            if is_dev_store:
                if orders_this_minute >= 5:
                    elapsed = time.time() - minute_start
                    if elapsed < 60:
                        wait_time = 60 - elapsed
                        time.sleep(wait_time)
                    orders_this_minute = 0
                    minute_start = time.time()

            # Create order time with hourly distribution
            hour = random.choices(
                list(range(24)),
                weights=[get_hour_multiplier(h) for h in range(24)],
                k=1
            )[0]

            order_time = current_date.replace(hour=hour) + timedelta(
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )

            # Select products with velocity weighting
            num_items = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1], k=1)[0]
            selected_variants = select_weighted_variants(variants, products, current_date, num_items)

            line_items = []
            for variant in selected_variants:
                quantity = random.choices([1, 2, 3, 5], weights=[0.7, 0.2, 0.08, 0.02], k=1)[0]
                line_items.append({
                    "variant_id": variant['id'],
                    "quantity": quantity
                })

            # Create order
            success = create_order(order_time, line_items, order_counter, is_dev_store)

            if success:
                daily_success += 1
                weekly_stats[week_key]['success'] += 1
            else:
                daily_failed += 1
                weekly_stats[week_key]['failed'] += 1

            order_counter += 1

            if is_dev_store:
                orders_this_minute += 1

            # Progress indicator
            if (i + 1) % 5 == 0:
                print("█", end="", flush=True)

            # Rate limiting for non-dev stores
            if not is_dev_store:
                time.sleep(0.6)

        # Daily result
        print(f" │ {daily_count:>3} orders │ ✅ {daily_success:>3} │ ❌ {daily_failed:>2}")

        current_date += timedelta(days=1)

    # Print last week summary
    if current_week is not None:
        week_success = total_success - week_start_success
        week_failed = total_failed - week_start_failed
        week_total = week_success + week_failed
        print(f"\n   └─ {current_week} Total: {week_total} orders (✅ {week_success} | ❌ {week_failed})")

    # Final summary
    print("\n" + "=" * 70)
    print("📊 FINAL SUMMARY")
    print("=" * 70)
    print(f"Period        : Oct 1-23, 2025")
    print(f"Duration      : {total_days} days")
    print(f"Success       : ✅ {total_success} orders")
    print(f"Failed        : ❌ {total_failed} orders")
    print(f"Total         : {total_success + total_failed} orders")
    print(f"Repeat Cust.  : ~{int(total_success * REPEAT_CUSTOMER_RATE)} customers")

    if total_success + total_failed > 0:
        success_rate = (total_success / (total_success + total_failed)) * 100
        avg_per_day = total_success / total_days
        print(f"Success Rate  : {success_rate:.1f}%")
        print(f"Avg/Day       : {avg_per_day:.1f} orders")

    # Weekly breakdown
    if len(weekly_stats) > 0:
        print("\n" + "─" * 70)
        print("📊 WEEKLY BREAKDOWN")
        print("─" * 70)
        for week_key in sorted(weekly_stats.keys()):
            stats = weekly_stats[week_key]
            week_total = stats['success'] + stats['failed']
            avg_per_day = stats['success'] / stats['days'] if stats['days'] > 0 else 0
            print(f"   {week_key:<10} : {week_total:>4} orders (✅ {stats['success']:>3} | ❌ {stats['failed']:>2}) - {avg_per_day:.1f}/day")

    if failed_reasons:
        print("\n" + "─" * 70)
        print("❌ ERROR BREAKDOWN")
        print("─" * 70)
        for code, count in sorted(failed_reasons.items()):
            if code == 429:
                print(f"   HTTP {code} (Rate Limit) : {count} occurrences")
            else:
                print(f"   HTTP {code}              : {count} occurrences")

    print("=" * 70)
    print("\n💡 NEXT STEPS:")
    print("   1. Run: npx tsx sync-and-verify.ts")
    print("   2. Check War Room: /app/war-room")
    print("   3. Verify baseline DEFCON level (should be 4-5)")
    print("=" * 70 + "\n")

def main():
    """Main execution"""
    print("\n🚀 BFCM BASELINE DATA GENERATOR")
    print("=" * 70)
    print(f"Shop Domain   : {SHOP_DOMAIN}")
    print("=" * 70)

    # Use dev store rate limits by default
    is_dev_store = True

    start_time = time.time()
    generate_bfcm_baseline_orders(is_dev_store)
    elapsed = time.time() - start_time
    print(f"\n⏱️  Execution time: {elapsed/60:.1f} minutes\n")

if __name__ == "__main__":
    main()
