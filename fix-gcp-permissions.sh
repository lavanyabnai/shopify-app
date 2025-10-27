#!/bin/bash

###############################################################################
# Google Cloud Pub/Sub Permission Fixer
#
# This script grants the necessary IAM permissions to your service account
# so it can access Google Cloud Pub/Sub topics and subscriptions.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - You must have Owner or Project IAM Admin role on the project
#
# Usage:
#   chmod +x fix-gcp-permissions.sh
#   ./fix-gcp-permissions.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID}"
TOPIC_ID="${GOOGLE_CLOUD_TOPIC_ID}"
SUBSCRIPTION_ID="${GOOGLE_CLOUD_SUBSCRIPTION_ID}"
SERVICE_ACCOUNT="shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com"
SHOPIFY_SERVICE_ACCOUNT="shopify-eventbridge@shopify-prs.iam.gserviceaccount.com"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Google Cloud Pub/Sub Permission Fixer              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if gcloud is installed
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    echo ""
    echo "Install gcloud CLI:"
    echo "  Linux/WSL: curl https://sdk.cloud.google.com | bash"
    echo "  macOS:     brew install google-cloud-sdk"
    echo "  Windows:   https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ gcloud CLI is installed${NC}"

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with gcloud${NC}"
    echo ""
    echo "Run: gcloud auth login"
    echo ""
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo -e "${GREEN}✅ Authenticated as: ${ACTIVE_ACCOUNT}${NC}"

# Set the project
echo ""
echo -e "${BLUE}🔧 Setting project: ${PROJECT_ID}${NC}"
gcloud config set project "${PROJECT_ID}" --quiet

# Verify project access
if ! gcloud projects describe "${PROJECT_ID}" &> /dev/null; then
    echo -e "${RED}❌ Cannot access project: ${PROJECT_ID}${NC}"
    echo ""
    echo "Make sure:"
    echo "  1. Project ID is correct: ${PROJECT_ID}"
    echo "  2. You have access to this project"
    echo "  3. You're authenticated with the right account"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Project access verified${NC}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Configuration:"
echo "  Project:      ${PROJECT_ID}"
echo "  Topic:        ${TOPIC_ID}"
echo "  Subscription: ${SUBSCRIPTION_ID}"
echo "  Service Acct: ${SERVICE_ACCOUNT}"
echo "════════════════════════════════════════════════════════════"
echo ""

# Grant IAM roles
echo -e "${BLUE}🔐 Granting IAM roles to service account...${NC}"
echo ""

# Role 1: Pub/Sub Viewer
echo -e "${YELLOW}➜ Granting Pub/Sub Viewer role...${NC}"
if gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/pubsub.viewer" \
    --quiet &> /dev/null; then
    echo -e "${GREEN}✅ Pub/Sub Viewer role granted${NC}"
else
    echo -e "${RED}❌ Failed to grant Pub/Sub Viewer role${NC}"
fi

# Role 2: Pub/Sub Subscriber
echo -e "${YELLOW}➜ Granting Pub/Sub Subscriber role...${NC}"
if gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/pubsub.subscriber" \
    --quiet &> /dev/null; then
    echo -e "${GREEN}✅ Pub/Sub Subscriber role granted${NC}"
else
    echo -e "${RED}❌ Failed to grant Pub/Sub Subscriber role${NC}"
fi

# Role 3: Pub/Sub Publisher (optional, for testing)
echo -e "${YELLOW}➜ Granting Pub/Sub Publisher role (for testing)...${NC}"
if gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/pubsub.publisher" \
    --quiet &> /dev/null; then
    echo -e "${GREEN}✅ Pub/Sub Publisher role granted${NC}"
else
    echo -e "${RED}❌ Failed to grant Pub/Sub Publisher role${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Granting topic permissions to Shopify...${NC}"
echo ""

# Grant Shopify permission to publish to topic
echo -e "${YELLOW}➜ Granting Shopify publisher access to topic...${NC}"
if gcloud pubsub topics add-iam-policy-binding "${TOPIC_ID}" \
    --member="serviceAccount:${SHOPIFY_SERVICE_ACCOUNT}" \
    --role="roles/pubsub.publisher" \
    --project="${PROJECT_ID}" \
    --quiet &> /dev/null; then
    echo -e "${GREEN}✅ Shopify can now publish to your topic${NC}"
else
    echo -e "${YELLOW}⚠️  Could not grant Shopify publisher role (topic may not exist)${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Permissions granted successfully!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verify permissions
echo -e "${BLUE}🔍 Verifying permissions...${NC}"
echo ""

echo "Current IAM policy for service account:"
gcloud projects get-iam-policy "${PROJECT_ID}" \
    --flatten="bindings[].members" \
    --filter="bindings.members:${SERVICE_ACCOUNT}" \
    --format="table(bindings.role)" | grep -E "(ROLE|pubsub)" || echo "No Pub/Sub roles found"

echo ""
echo -e "${YELLOW}⏳ Waiting 10 seconds for IAM changes to propagate...${NC}"
sleep 10

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Verify the setup:"
echo "     ${BLUE}node check-gcp-pubsub-setup.js${NC}"
echo ""
echo "  2. Start the consumer:"
echo "     ${BLUE}npm run gcp-consumer${NC}"
echo ""
echo "  3. Test with Shopify webhook:"
echo "     ${BLUE}shopify webhook trigger --topic orders/create${NC}"
echo ""
echo "  4. Monitor in Cloud Console:"
echo "     ${BLUE}https://console.cloud.google.com/cloudpubsub/topic/detail/${TOPIC_ID}${NC}"
echo ""
