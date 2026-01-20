# Usage Examples

## Basic Usage

### 1. First Time Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit with your credentials
nano .env.local
```

### 2. Test Your Configuration

```bash
npm run test-config
```

**Example Output:**
```
🔍 Testing Gorgias Flows Migrator Configuration

1️⃣  Loading configuration...
✅ Configuration loaded successfully

📋 Configuration:
   Subdomain: mycompany
   Username: admin@mycompany.com
   API Key: abc123xyz...
   Help Center ID: 12345
   Store Integration ID: 67890
   Log Level: info
   Dry Run: false

2️⃣  Testing API connectivity...
   Testing Flows API...
   ✅ Flows API: 15 flows found

   Testing Guidances API...
   ✅ Guidances API: 3 guidances found

✅ Configuration test complete!
```

### 3. Dry Run Migration

```bash
DRY_RUN=true npm run migrate
```

**Example Output:**
```
[INFO] Starting Flows to Guidances migration...
[INFO] Subdomain: mycompany
[INFO] Help Center ID: 12345
[INFO] Store Integration ID: 67890
[INFO] Dry Run: true
[INFO] ---
[INFO] Fetching Flows from Gorgias...
✅ Retrieved 15 flows
[INFO] Found 15 flows to migrate
[INFO] Converting 15 flows to guidances...
✅ Converted 15 flows to guidances
[INFO] 15 valid guidances ready for import
[WARN] Found 3 existing guidances. New guidances will be added/updated.
[WARN] [DRY RUN] Would import the following guidances:
[INFO]   - Order Status Inquiry (flow_123)
[INFO]   - Refund Request (flow_456)
[INFO]   - Shipping Questions (flow_789)
[INFO]   - Product Recommendations (flow_101)
[INFO]   - Return Policy (flow_112)
[INFO] ---
[INFO] Migration Summary:
[INFO]   Total Flows: 15
[INFO]   Valid Guidances: 15
[INFO]   Skipped: 0
```

### 4. Real Migration

```bash
npm run migrate
```

**Example Output:**
```
[INFO] Starting Flows to Guidances migration...
[INFO] Subdomain: mycompany
[INFO] Dry Run: false
[INFO] ---
[INFO] Fetching Flows from Gorgias...
✅ Retrieved 15 flows
[INFO] Found 15 flows to migrate
[INFO] Converting 15 flows to guidances...
✅ Converted 15 flows to guidances
[INFO] 15 valid guidances ready for import
[INFO] Creating 15 AI Guidances...
✅ Successfully created 15 guidances
✅ Migration completed successfully!
[INFO] ---
[INFO] Migration Summary:
[INFO]   Total Flows: 15
[INFO]   Valid Guidances: 15
[INFO]   Skipped: 0
```

## Advanced Usage

### Migrate Specific Flow

```bash
npm run migrate 123
```

**Example Output:**
```
[INFO] Migrating single flow: 123
[INFO] Fetching Flow 123...
[INFO] Converting 1 flows to guidances...
✅ Converted 1 flows to guidances
[INFO] Creating 1 AI Guidances...
✅ Successfully created 1 guidances
✅ Flow migrated successfully!
```

### Debug Mode

```bash
LOG_LEVEL=debug npm run migrate
```

**Example Output:**
```
[DEBUG] API Request: GET /api/flows
[DEBUG] API Response: 200 /api/flows
[DEBUG] Converting flow: Order Status Inquiry (ID: 123)
[DEBUG] Created guidance with key: flow_123
[DEBUG] API Request: POST /api/help-center/help-centers/12345/guidances/ai/67890
[DEBUG] API Response: 200 /api/help-center/help-centers/12345/guidances/ai/67890
```

### Custom Environment File

```bash
# Use different environment file
cp .env.local .env.production
# Edit .env.production with production credentials

# Run with production config
DRY_RUN=true npm run migrate
```

## Error Scenarios

### Missing Configuration

```bash
npm run migrate
```

**Error Output:**
```
[ERROR] Fatal error: Missing required environment variables: GORGIAS_SUBDOMAIN, GORGIAS_API_KEY
```

**Fix:**
```bash
# Edit .env.local and add missing values
nano .env.local
```

### Invalid API Credentials

```bash
npm run migrate
```

**Error Output:**
```
[ERROR] API Error: 401 /api/flows
[ERROR] Failed to fetch flows: Request failed with status code 401
[ERROR] Migration failed: Failed to fetch flows: Request failed with status code 401
```

**Fix:**
- Check your API key in [.env.local](.env.local)
- Verify username is correct
- Ensure API key hasn't expired

### Flows Endpoint Not Found

```bash
npm run migrate
```

**Error Output:**
```
[ERROR] API Error: 404 /api/flows
[ERROR] Failed to fetch flows: Request failed with status code 404
[ERROR] Migration failed: Failed to fetch flows: Request failed with status code 404
```

**Fix:**
- Contact Gorgias support to verify endpoint availability
- Ensure your account has access to Flows API
- Check if subdomain is correct

### No Flows Found

```bash
npm run migrate
```

**Output:**
```
[INFO] Fetching Flows from Gorgias...
✅ Retrieved 0 flows
[WARN] No flows found to migrate
```

**This is normal if:**
- You have no flows configured in Gorgias
- All flows have been migrated
- API returned empty results

## Real-World Example

### Scenario: Migrating 50 Flows

```bash
# Step 1: Test config
npm run test-config
# Output: ✅ 50 flows found

# Step 2: Dry run
DRY_RUN=true npm run migrate
# Output: [WARN] Would import 50 guidances

# Step 3: Review what will be imported
# Check the list of guidance names in output

# Step 4: Run real migration
npm run migrate
# Output: ✅ Successfully created 50 guidances

# Step 5: Verify in Gorgias
# Log into Gorgias → Help Center → AI Guidances
# Confirm all 50 guidances are present
```

## Flow to Guidance Examples

### Example 1: Simple Flow

**Input Flow:**
```json
{
  "id": 123,
  "name": "Order Status",
  "description": "Help customers check order status",
  "conditions": [
    {
      "type": "message_contains",
      "value": "order status"
    }
  ],
  "actions": [
    {
      "type": "send_response",
      "message": "I'll help you check your order."
    }
  ]
}
```

**Output Guidance:**
```json
{
  "key": "flow_123",
  "name": "Order Status",
  "content": "Help customers check order status\n\n**Conditions:**\n1. message_contains: order status\n\n**Actions:**\n1. send_response: I'll help you check your order.",
  "batch_datetime": "2025-11-24T20:00:00.000Z",
  "review_action": "created"
}
```

### Example 2: Complex Flow

**Input Flow:**
```json
{
  "id": 456,
  "name": "Refund Processing",
  "description": "Automated refund request handling",
  "conditions": [
    {
      "field": "body_text",
      "operator": "contains",
      "value": "refund"
    },
    {
      "type": "channel",
      "value": "email"
    }
  ],
  "actions": [
    {
      "type": "add_tag",
      "value": "refund-request"
    },
    {
      "type": "assign_to_team",
      "value": "Finance Team"
    }
  ],
  "triggers": [
    {
      "type": "new_message"
    }
  ]
}
```

**Output Guidance:**
```json
{
  "key": "flow_456",
  "name": "Refund Processing",
  "content": "Automated refund request handling\n\n**Conditions:**\n1. body_text contains refund\n2. channel: email\n\n**Actions:**\n1. add_tag: refund-request\n2. assign_to_team: Finance Team\n\n**Triggers:**\n1. new_message",
  "batch_datetime": "2025-11-24T20:00:00.000Z",
  "review_action": "created"
}
```

## Troubleshooting Commands

### Check API Connectivity
```bash
npm run test-config
```

### Verbose Logging
```bash
LOG_LEVEL=debug npm run migrate
```

### Safe Test Run
```bash
DRY_RUN=true LOG_LEVEL=debug npm run migrate
```

### Test Specific Flow
```bash
DRY_RUN=true npm run migrate 123
```

## Tips & Best Practices

1. **Always dry run first**: Use `DRY_RUN=true` before real migration
2. **Test with one flow**: Migrate a single flow first to validate
3. **Check existing guidances**: Review what's already imported
4. **Backup flows**: Export your flows from Gorgias before migration
5. **Verify results**: Check Gorgias Help Center after migration

## Next Steps After Migration

1. **Review Guidances**: Log into Gorgias Help Center
2. **Edit Content**: Refine guidance content for AI Agent
3. **Test AI Agent**: Verify AI uses guidances correctly
4. **Monitor Performance**: Track AI Agent responses
5. **Iterate**: Update guidances based on performance
