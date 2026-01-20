# Migration Tool Progress

## ✅ What's Working

### Flows API
- **Endpoint**: `https://api.gorgias.work/configurations`
- **Authentication**: Bearer token (JWT)
- **Status**: ✅ **WORKING** - Successfully fetching 61 flows
- **Script**: `npm run fetch-flows`

### Configuration
- Gorgias Subdomain: `anton-gorgias-demo-store`
- Help Center ID: `79935` (for Guidances)
- Store Name: `anton-savytski-test-store`
- Bearer Token: Configured in `.env.local`

## 🔄 In Progress

### 1. Guidances API Endpoint
**Current Status**: Searching for the correct endpoint

**What we know**:
- AI Agent Config API: `https://aiagent.gorgias.help`
- Store Config endpoint works: `/api/config/accounts/{account}/stores/{store}/configuration`
- Help Center ID for guidances: `79935`

**What we need**:
- Exact endpoint to CREATE/UPDATE guidances
- Likely format: POST/PUT to Help Center API

**Action needed**: Check browser Network tab when viewing/editing Guidances in AI Agent settings

### 2. Bearer Token Automation
**Current Status**: Manual token extraction from browser

**Problem**: JWT tokens expire, requiring manual refresh

**Solution**: Automate token generation via `/gorgias-apps/auth`

**What we need**:
- Correct request format for `/gorgias-apps/auth`
- May need session cookies or special headers

## 📋 API Endpoints Discovered

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `api.gorgias.work/configurations` | GET | List all Flows | ✅ Working |
| `aiagent.gorgias.help/api/config/accounts/{account}/stores/{store}/configuration` | GET | Get AI Agent config | ✅ Working |
| `{subdomain}.gorgias.com/gorgias-apps/auth` | POST | Get Bearer token | 🔄 Testing |
| Unknown | POST/PUT | Create/Update Guidances | ❓ To discover |

## 🎯 Next Steps

### Immediate
1. **Find Guidances Endpoint** ⏳
   - Check browser Network tab for Guidances API calls
   - Test POST/PUT to Help Center API

2. **Automate Bearer Token** ⏳
   - Figure out `/gorgias-apps/auth` request format
   - Eliminate manual token extraction

### After That
3. **Complete Conversion Logic**
   - Map Flow structure to Guidance format
   - Handle nested steps, transitions, inputs

4. **Test Full Migration**
   - Dry-run with real flows
   - Verify Guidances creation
   - Validate AI Agent uses them correctly

## 📊 Current Tool Capabilities

✅ **Working Now**:
```bash
# Fetch all flows to JSON
npm run fetch-flows

# Test configuration
npm run test-config

# Explore endpoints
npm run explore
```

⏳ **Coming Soon**:
```bash
# Full migration (when Guidances API is found)
npm run migrate

# Auto-refresh token
npm run auth
```

## 🔧 Files Created

- ✅ [src/fetch-flows.ts](src/fetch-flows.ts) - Flows export script
- ✅ [src/test-ai-agent-api.ts](src/test-ai-agent-api.ts) - AI Agent API tester
- ✅ [src/explore-endpoints.ts](src/explore-endpoints.ts) - Endpoint discovery
- ✅ [flows-export.json](flows-export.json) - Exported flows data
- ✅ [.env.local](.env.local) - Configuration with Bearer token

## 📝 Notes

- Flows API is NOT in official Gorgias docs - it's internal
- Same Bearer token works for both `api.gorgias.work` and `aiagent.gorgias.help`
- JWT token format includes: `user_id`, `account_id`, `roles`, `exp` (expiration)
- Guidances are separate from the main AI Agent configuration

## ❓ Questions for User

1. **Guidances API**: Can you check browser Network tab when editing Guidances?
2. **Priority**: Focus on token automation first, or find Guidances endpoint first?
3. **Manual workaround**: Would a semi-automated tool (manual token refresh) work temporarily?

---

**Last Updated**: November 24, 2025
**Flows Fetched**: 61
**Bearer Token Expiry**: Check JWT `exp` field
