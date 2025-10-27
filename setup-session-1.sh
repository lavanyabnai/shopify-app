#!/bin/bash
# Setup script for BFCM Testing Session 1
# Copies Python scripts to your existing order generator directory

set -e  # Exit on error

echo "🚀 Setting up BFCM Testing Session 1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Detect order generator directory
ORDER_GEN_DIR="$HOME/scripts/shopify-order-generator"

if [ ! -d "$ORDER_GEN_DIR" ]; then
    echo "❌ Error: Order generator directory not found at $ORDER_GEN_DIR"
    echo ""
    echo "Expected directory structure:"
    echo "  ~/scripts/shopify-order-generator/"
    echo "    ├── src/"
    echo "    │   └── monthly_orders.py"
    echo "    ├── .env"
    echo "    └── venv/ (optional)"
    echo ""
    echo "Please provide the correct path to your order generator directory:"
    read -p "Path: " ORDER_GEN_DIR

    if [ ! -d "$ORDER_GEN_DIR" ]; then
        echo "❌ Directory not found. Exiting."
        exit 1
    fi
fi

echo "✅ Found order generator directory: $ORDER_GEN_DIR"

# Check for .env file
if [ ! -f "$ORDER_GEN_DIR/.env" ]; then
    echo "⚠️  Warning: .env file not found in $ORDER_GEN_DIR"
    echo ""
    echo "Creating .env template..."
    cat > "$ORDER_GEN_DIR/.env" << 'EOF'
# Shopify Store Configuration
SHOP_DOMAIN=control-tower-2.myshopify.com
ACCESS_TOKEN=your_admin_api_token_here
API_VERSION=2024-01
EOF
    echo "✅ Created .env template at $ORDER_GEN_DIR/.env"
    echo "⚠️  Please update ACCESS_TOKEN in $ORDER_GEN_DIR/.env before running scripts"
else
    echo "✅ Found .env file"
fi

# Copy Python script
echo ""
echo "📋 Copying BFCM order generator script..."
cp bfcm-order-generator.py "$ORDER_GEN_DIR/"
echo "✅ Copied to: $ORDER_GEN_DIR/bfcm-order-generator.py"

# Check Python dependencies
echo ""
echo "🔍 Checking Python dependencies..."

# Try to activate venv if it exists
if [ -d "$ORDER_GEN_DIR/venv" ]; then
    echo "✅ Found virtual environment"
    source "$ORDER_GEN_DIR/venv/bin/activate" 2>/dev/null || true
fi

# Check for required packages
python3 -c "import requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Missing: requests"
    echo "   Install with: pip install requests"
fi

python3 -c "import dotenv" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Missing: python-dotenv"
    echo "   Install with: pip install python-dotenv"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Scripts Location: $ORDER_GEN_DIR"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Verify .env configuration:"
echo "   cat $ORDER_GEN_DIR/.env"
echo ""
echo "2. Install missing dependencies (if needed):"
echo "   cd $ORDER_GEN_DIR"
echo "   pip install requests python-dotenv"
echo ""
echo "3. Run Session 1 baseline generator:"
echo "   cd $ORDER_GEN_DIR"
echo "   python bfcm-order-generator.py"
echo ""
echo "4. After orders are generated, sync to database:"
echo "   cd ~/shopify-app-template-remix"
echo "   npx tsx sync-and-verify.ts"
echo ""
echo "5. Verify baseline metrics:"
echo "   npx tsx verify-war-room-baseline.ts"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
