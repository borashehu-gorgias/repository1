# Quick Start Guide

## 1. Setup (2 minutes)

### Install Dependencies
```bash
npm install
```

### Configure Environment
Copy the example file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
GORGIAS_SUBDOMAIN=mycompany
GORGIAS_API_KEY=abc123...
GORGIAS_USERNAME=admin@mycompany.com
HELP_CENTER_ID=12345
STORE_INTEGRATION_ID=67890
```

## 2. Test with Dry Run

Test without making changes:
```bash
DRY_RUN=true npm run migrate
```

This will:
- ✅ Fetch flows from Gorgias
- ✅ Convert them to guidances
- ✅ Show what would be imported
- ❌ NOT actually import anything

## 3. Run Migration

When ready, run the actual migration:
```bash
npm run migrate
```

Or migrate a specific flow:
```bash
npm run migrate 123
```

## Finding Your IDs

### Gorgias API Credentials
1. Go to: Settings → Your Profile → REST API
2. Copy: Username, API Key, Subdomain

### Help Center ID
Method 1: Check URL when viewing Help Center settings
```
https://{subdomain}.gorgias.com/app/settings/help-center/{help_center_id}
```

Method 2: Use browser DevTools
1. Open Help Center settings
2. Open Network tab
3. Look for API calls containing `help-center`
4. Check the URL for the ID

### Store Integration ID
Method 1: Check integrations page URL
```
https://{subdomain}.gorgias.com/app/integrations/{store_integration_id}
```

Method 2: Contact Gorgias support if unsure

## Troubleshooting

### 401 Unauthorized
❌ Invalid API credentials
✅ Check username, API key, and subdomain in `.env.local`

### 404 Not Found
❌ Endpoint doesn't exist or wrong IDs
✅ Verify Help Center ID and Store Integration ID
✅ Contact Gorgias to confirm API endpoints

### No Flows Found
❌ No flows in your account
✅ Check Gorgias dashboard for existing flows
✅ Verify API permissions

## Next Steps

After successful migration:
1. Check your Gorgias Help Center for imported guidances
2. Review and edit guidances as needed
3. Test AI Agent responses with new guidances

## Support

- Tool Issues: Check README.md
- API Issues: Contact Gorgias Support
- Endpoint Questions: Verify with Gorgias that your account has access
