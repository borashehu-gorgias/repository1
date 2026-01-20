#!/bin/bash

# Test Guidances API with OAuth token
# Usage: ./test-guidances-api.sh <OAUTH_TOKEN> <SUBDOMAIN>

OAUTH_TOKEN=$1
SUBDOMAIN=$2

if [ -z "$OAUTH_TOKEN" ] || [ -z "$SUBDOMAIN" ]; then
  echo "Usage: ./test-guidances-api.sh <OAUTH_TOKEN> <SUBDOMAIN>"
  echo "Example: ./test-guidances-api.sh eyJhbG... anton-gorgias-demo-store"
  exit 1
fi

echo "Testing OAuth token with Guidances API..."
echo ""

# Test 1: Get help centers
echo "=== Test 1: List Help Centers ==="
curl -s -X GET "https://${SUBDOMAIN}.gorgias.com/api/help-center/help-centers" \
  -H "Authorization: Bearer ${OAUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""

# Test 2: Get integrations (to find store integration ID)
echo "=== Test 2: List Integrations ==="
curl -s -X GET "https://${SUBDOMAIN}.gorgias.com/api/integrations" \
  -H "Authorization: Bearer ${OAUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq '.data[] | select(.type == "shopify") | {id, name, type}'

echo ""
echo ""

# Test 3: Try to access guidances endpoint
echo "=== Test 3: Test Guidances Endpoint (will likely 404 if IDs are wrong) ==="
echo "Note: This may fail if we don't have correct help_center_id and store_integration_id"
curl -s -X GET "https://${SUBDOMAIN}.gorgias.com/api/help-center/help-centers/79935/guidances/ai/35564" \
  -H "Authorization: Bearer ${OAUTH_TOKEN}" \
  -H "Content-Type: application/json" -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""
echo "✅ If you see 401/403, OAuth token doesn't have permission"
echo "✅ If you see 404, endpoint/IDs are wrong but auth worked"
echo "✅ If you see 200, everything works!"

