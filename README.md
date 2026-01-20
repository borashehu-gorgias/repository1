# Gorgias Flows to AI Guidances Migrator

A TypeScript tool to migrate Gorgias Flows to AI Guidances format and import them into your Gorgias account.

## Features

- ✅ Fetch all Flows from Gorgias API
- ✅ Convert Flows to AI Guidance format
- ✅ Import Guidances via Help Center API
- ✅ Dry-run mode for safe testing
- ✅ Comprehensive error handling and logging
- ✅ Support for migrating individual flows or all flows

## Prerequisites

- Node.js 18+ installed
- Gorgias account with API access
- API credentials (username and API key)
- Help Center ID and Store Integration ID

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit [.env.local](.env.local) with your Gorgias credentials:

```env
# Gorgias Configuration
GORGIAS_SUBDOMAIN=your-subdomain
GORGIAS_API_KEY=your-api-key-here
GORGIAS_USERNAME=your-email@example.com

# Help Center Configuration
HELP_CENTER_ID=your-help-center-id
STORE_INTEGRATION_ID=your-store-integration-id

# Optional: Logging
LOG_LEVEL=info
DRY_RUN=false
```

## Getting Your Credentials

### Gorgias API Credentials

1. Log in to your Gorgias account
2. Go to **Settings** → **Your Profile** → **REST API**
3. Create a new API key or use an existing one
4. Copy your:
   - **Username** (your email)
   - **API Key**
   - **Subdomain** (from your Gorgias URL: `https://{subdomain}.gorgias.com`)

### Help Center & Store Integration IDs

To find these IDs, you may need to:

1. Navigate to your Help Center settings in Gorgias
2. Check the URL or API responses for `help_center_id`
3. For `store_integration_id`, check your integrations page or contact Gorgias support

**Note:** These endpoints may be internal/undocumented. If you encounter issues, contact Gorgias support for the correct API endpoints.

### Retrieving the Long-Form JWT Token

The application also supports authentication using a long-form JWT token, which is useful for accessing Flows and other internal APIs. Here's how to retrieve it:

1. **Log in to your Gorgias account:**
   - Navigate to `https://{your-subdomain}.gorgias.com`
   - Ensure you're logged into the account you want to access

2. **Open the Flows section:**
   - Go to the Flows page in your Gorgias dashboard
   - The URL will be something like: `https://{subdomain}.gorgias.com/app/flows/...`

3. **Open Developer Tools:**
   - Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Or right-click anywhere on the page and select "Inspect"

4. **Navigate to the Network tab:**
   - Click on the "Network" tab in Developer Tools
   - Make sure recording is enabled (the red circle icon should be active)

5. **Refresh the page:**
   - Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) to refresh the page
   - This will capture all network requests

6. **Search for the auth request:**
   - In the Network tab's filter/search box, type: `auth`
   - Look for a request to `/api/help-center/auth` or similar
   - Click on this request to view its details

7. **Copy the JWT token:**
   - Click on the "Response" tab
   - Look for a field called `token` in the JSON response
   - The value will be a long string starting with `eyJ...`
   - Copy this entire token value

8. **Use the token:**
   - Paste this token when prompted by the application
   - Or store it in your session for API access

**Visual Guide:**
```
Developer Tools → Network tab → Refresh page → Search "auth" →
Click on auth request → Response tab → Copy the "token" field value
```

**Example Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "user": { ... },
  "account": { ... }
}
```

**Note:** This JWT token is session-specific and will expire. You may need to retrieve a new one if your session expires.

## Usage

### Migrate All Flows

```bash
npm run migrate
```

This will:
1. Fetch all Flows from your Gorgias account
2. Convert them to AI Guidances format
3. Import them to your Help Center

### Migrate a Specific Flow

```bash
npm run migrate <flow_id>
```

Example:
```bash
npm run migrate 12345
```

### Dry Run Mode

Test the migration without making actual changes:

```bash
DRY_RUN=true npm run migrate
```

Or set `DRY_RUN=true` in your [.env.local](.env.local) file.

### Development Mode

Run with hot-reload during development:

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## Configuration Options

| Variable | Required | Description |
|----------|----------|-------------|
| `GORGIAS_SUBDOMAIN` | Yes | Your Gorgias subdomain |
| `GORGIAS_API_KEY` | Yes | API key from Gorgias settings |
| `GORGIAS_USERNAME` | Yes | Your Gorgias account email |
| `HELP_CENTER_ID` | Yes | Your Help Center ID |
| `STORE_INTEGRATION_ID` | Yes | Your Store Integration ID |
| `LOG_LEVEL` | No | Logging level: `debug`, `info`, `warn`, `error` (default: `info`) |
| `DRY_RUN` | No | Enable dry-run mode: `true` or `false` (default: `false`) |

## Flow to Guidance Conversion

The tool converts Flows to Guidances with the following mapping:

- **Flow Name** → **Guidance Name**
- **Flow ID** → **Guidance Key** (prefixed with `flow_`)
- **Flow Description** → Included in **Guidance Content**
- **Flow Conditions** → Formatted in **Guidance Content**
- **Flow Actions** → Formatted in **Guidance Content**
- **Flow Triggers** → Formatted in **Guidance Content**

### Example Conversion

**Flow:**
```json
{
  "id": 123,
  "name": "Order Status Inquiry",
  "description": "Handle customer inquiries about order status",
  "conditions": [...],
  "actions": [...]
}
```

**Guidance:**
```json
{
  "key": "flow_123",
  "name": "Order Status Inquiry",
  "content": "Handle customer inquiries about order status\n\n**Conditions:**\n1. ...\n\n**Actions:**\n1. ...",
  "batch_datetime": "2025-11-24T20:00:00.000Z",
  "review_action": "created"
}
```

## API Endpoints Used

### Flows API
- **List Flows:** `GET https://{subdomain}.gorgias.com/api/flows`
- **Get Flow:** `GET https://{subdomain}.gorgias.com/api/flows/{flow_id}`

### Guidances API
- **Get Guidances:** `GET https://{subdomain}.gorgias.com/api/help-center/help-centers/{help_center_id}/guidances/ai/{store_integration_id}`
- **Create Guidances:** `POST https://{subdomain}.gorgias.com/api/help-center/help-centers/{help_center_id}/guidances/ai/{store_integration_id}`

**⚠️ Note:** These endpoints may be internal/undocumented. Validate them with Gorgias support if you encounter issues.

## Logging

The tool provides detailed logging at different levels:

- **DEBUG:** Detailed API requests and internal operations
- **INFO:** General progress and important steps
- **WARN:** Non-critical issues and warnings
- **ERROR:** Critical errors and failures

Set the log level in [.env.local](.env.local):
```env
LOG_LEVEL=debug
```

## Error Handling

The tool includes comprehensive error handling for:

- Missing environment variables
- API authentication failures
- Invalid flow data
- Network errors
- Validation failures

All errors are logged with detailed messages to help troubleshoot issues.

## Troubleshooting

### Authentication Errors

**Issue:** `401 Unauthorized`

**Solution:**
- Verify your API credentials in [.env.local](.env.local)
- Ensure your API key is still active
- Check that your username (email) is correct

### Endpoint Not Found

**Issue:** `404 Not Found` for Flows or Guidances endpoints

**Solution:**
- The Flows API may be internal/undocumented
- Contact Gorgias support to verify the correct endpoints
- Check if your account has access to these features

### Invalid Guidance Data

**Issue:** Guidances fail validation

**Solution:**
- Check the Flow data structure
- Ensure all required fields are present
- Review conversion logic in [src/converter.ts](src/converter.ts)

### Network Timeouts

**Issue:** Request timeout errors

**Solution:**
- Check your internet connection
- Verify Gorgias API is accessible
- The timeout is set to 30 seconds (configurable in [src/api-client.ts](src/api-client.ts:15))

## Project Structure

```
gorgias-flows-migrator/
├── src/
│   ├── index.ts          # Main entry point
│   ├── config.ts         # Configuration loader
│   ├── types.ts          # TypeScript types and schemas
│   ├── logger.ts         # Logging utility
│   ├── api-client.ts     # Gorgias API client
│   ├── converter.ts      # Flow to Guidance conversion
│   └── migrator.ts       # Main migration orchestrator
├── dist/                 # Compiled JavaScript (generated)
├── .env.local           # Environment variables (not committed)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Development

### Code Structure

- **Types & Validation:** [src/types.ts](src/types.ts) uses Zod for runtime type validation
- **API Client:** [src/api-client.ts](src/api-client.ts) handles all HTTP requests with Axios
- **Conversion Logic:** [src/converter.ts](src/converter.ts) transforms Flow objects to Guidance format
- **Migration Orchestration:** [src/migrator.ts](src/migrator.ts) coordinates the full migration process

### Adding Custom Conversion Logic

Edit [src/converter.ts](src/converter.ts) to customize how Flows are converted:

```typescript
function buildGuidanceContent(flow: Flow): string {
  // Customize content generation here
}
```

## Security Notes

- ✅ API credentials are loaded from [.env.local](.env.local) (not committed to git)
- ✅ Basic Auth is used for API authentication
- ✅ All credentials should be kept secure
- ⚠️ Never commit [.env.local](.env.local) to version control

## References

- [Gorgias Developer Documentation](https://developers.gorgias.com/)
- [Gorgias REST API](https://docs.gorgias.com/en-US/rest-api-208286)
- [Gorgias API Reference](https://developers.gorgias.com/reference/introduction)

## Support

For issues with:
- **This tool:** Create an issue in this repository
- **Gorgias API:** Contact [Gorgias Support](https://docs.gorgias.com/)
- **API Endpoints:** Verify with Gorgias that you have access to the Flows and Guidances APIs

## License

MIT
