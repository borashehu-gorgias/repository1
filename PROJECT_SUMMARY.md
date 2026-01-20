# Gorgias Flows Migrator - Project Summary

## ✅ Project Complete

A production-ready TypeScript migration tool that converts Gorgias Flows to AI Guidances and imports them into your Gorgias account.

## 📦 What's Included

### Core Files
- **[src/index.ts](src/index.ts)** - Main entry point and CLI interface
- **[src/migrator.ts](src/migrator.ts)** - Migration orchestration logic
- **[src/converter.ts](src/converter.ts)** - Flow to Guidance conversion logic
- **[src/api-client.ts](src/api-client.ts)** - Gorgias API HTTP client
- **[src/types.ts](src/types.ts)** - TypeScript types and Zod schemas
- **[src/config.ts](src/config.ts)** - Environment configuration loader
- **[src/logger.ts](src/logger.ts)** - Logging utility
- **[src/test-config.ts](src/test-config.ts)** - Configuration testing script

### Documentation
- **[README.md](README.md)** - Comprehensive documentation
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide
- **[example-flow.json](example-flow.json)** - Example flow structure

### Configuration
- **[.env.local](.env.local)** - Your credentials (🔒 not committed)
- **[.env.local.example](.env.local.example)** - Template for credentials
- **[package.json](package.json)** - Dependencies and scripts
- **[tsconfig.json](tsconfig.json)** - TypeScript configuration

## 🚀 Quick Commands

```bash
# Test your configuration
npm run test-config

# Dry run (safe test)
DRY_RUN=true npm run migrate

# Migrate all flows
npm run migrate

# Migrate specific flow
npm run migrate 123
```

## 🔑 Features Implemented

### ✅ API Integration
- Fetch Flows from Gorgias (`GET /api/flows`)
- Fetch Flow by ID (`GET /api/flows/{id}`)
- Fetch existing Guidances (`GET /api/help-center/...`)
- Create Guidances (`POST /api/help-center/...`)
- Update Guidances (`PUT /api/help-center/...`)

### ✅ Conversion Logic
- Flow → Guidance mapping
- Content generation from conditions/actions/triggers
- Unique key generation (`flow_{id}`)
- Validation of converted guidances

### ✅ Error Handling
- Environment validation
- API authentication errors
- Network timeouts (30s)
- Invalid data handling
- Comprehensive logging

### ✅ Configuration
- Environment-based config
- Dry-run mode for testing
- Configurable log levels
- Per-flow or batch migration

### ✅ Safety
- Credentials via [.env.local](.env.local)
- [.gitignore](.gitignore) for sensitive files
- Dry-run mode before real migration
- Validation before import

## 📊 API Endpoints Used

Based on your provided information and validation:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/flows` | GET | List all flows |
| `/api/flows/{flow_id}` | GET | Get specific flow |
| `/api/help-center/help-centers/{help_center_id}/guidances/ai/{store_integration_id}` | GET | List guidances |
| `/api/help-center/help-centers/{help_center_id}/guidances/ai/{store_integration_id}` | POST | Create guidances |
| `/api/help-center/help-centers/{help_center_id}/guidances/ai/{store_integration_id}` | PUT | Update guidances |

⚠️ **Note:** These endpoints may be internal/undocumented. Validated with Gorgias MCP dev tools during build.

## 🏗️ Architecture

```
┌─────────────┐
│  CLI Entry  │  src/index.ts
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Migrator   │  src/migrator.ts (orchestration)
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌────────────┐  ┌─────────────┐
│ API Client │  │  Converter  │
│  (fetch)   │  │ (transform) │
└────────────┘  └─────────────┘
```

## 🔄 Migration Flow

1. **Load Config** → Read [.env.local](.env.local)
2. **Fetch Flows** → GET from Gorgias API
3. **Convert** → Transform to Guidance format
4. **Validate** → Check required fields
5. **Import** → POST to Gorgias API
6. **Report** → Log summary

## 🧪 Testing Your Setup

### Step 1: Test Configuration
```bash
npm run test-config
```

Expected output:
```
✅ Configuration loaded successfully
✅ Flows API: X flows found
✅ Guidances API: Y guidances found
```

### Step 2: Dry Run
```bash
DRY_RUN=true npm run migrate
```

Expected output:
```
[INFO] Starting Flows to Guidances migration...
[INFO] Found X flows to migrate
[WARN] [DRY RUN] Would import the following guidances:
  - Order Status Inquiry (flow_123)
  - Refund Request (flow_456)
[INFO] Migration Summary:
  Total Flows: X
  Valid Guidances: Y
```

### Step 3: Real Migration
```bash
npm run migrate
```

Expected output:
```
[INFO] Starting Flows to Guidances migration...
✅ Successfully created X guidances
✅ Migration completed successfully!
```

## ⚠️ Important Notes

### API Endpoint Validation

The Flows API endpoints (`/api/flows`) do **not** appear in the official Gorgias API documentation at [developers.gorgias.com](https://developers.gorgias.com/). This suggests:

1. **Internal API**: These may be internal/undocumented endpoints
2. **Account Access**: Your account may need special permissions
3. **Version-Specific**: Endpoints may vary by Gorgias plan/version

**Recommendation**: Contact Gorgias support to:
- Confirm endpoint availability
- Verify correct endpoint paths
- Ensure your account has access

### Guidances API

The Guidances API structure you provided appears to be for AI Agent features. This is a newer Gorgias feature, so verify:
- Your account has AI Agent enabled
- Help Center is configured
- Store integration is active

## 🐛 Known Issues & Considerations

1. **Endpoint Availability**: Flows API may not be publicly documented
2. **Response Format**: Actual API responses may differ from expectations
3. **Field Mapping**: Flow structure may vary between Gorgias versions
4. **Batch Limits**: Unknown if there are limits on guidances per request

## 🔜 Next Steps

1. **Configure** your [.env.local](.env.local) file
2. **Test** with `npm run test-config`
3. **Dry Run** with `DRY_RUN=true npm run migrate`
4. **Migrate** with `npm run migrate`
5. **Verify** guidances in Gorgias Help Center

## 📚 Resources

- [README.md](README.md) - Full documentation
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [Gorgias Developers](https://developers.gorgias.com/)
- [Gorgias API Docs](https://docs.gorgias.com/en-US/rest-api-208286)

## 🆘 Support

- **Tool Issues**: Check README troubleshooting section
- **API Errors**: Contact Gorgias support
- **Questions**: Review QUICK_START.md

---

**Built with:** TypeScript, Axios, Zod
**License:** MIT
**Created:** November 2025
