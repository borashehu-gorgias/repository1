# Gorgias API Discovery

## Overview

Gorgias uses **multiple separate APIs** with **different authentication methods**. This document tracks all discovered endpoints.

## API Domains

| Domain | Purpose | Auth Method |
|--------|---------|-------------|
| `{subdomain}.gorgias.com` | Main Gorgias API | Basic Auth (username + API key) |
| `api.gorgias.work` | Flows/Automation API | Bearer Token (JWT - long) |
| `aiagent.gorgias.help` | AI Agent Configuration | Bearer Token (JWT - long) |
| `internal-help-center-api.gorgias.com` | Help Center Internal API | Bearer Token (JWT - short) |

## Authentication Tokens

### Token 1: Long JWT (for Flows & AI Agent)
- **Format**: Very long JWT (~900 chars)
- **Used by**: `api.gorgias.work`, `aiagent.gorgias.help`
- **Contains**: `user_id`, `account_id`, `roles`, `exp`
- **Expiration**: Long-lived (hours/days)
- **Example**: `eyJhbGciOiJSUzI1NiIs...` (RS256)

### Token 2: Short JWT (for Help Center)
- **Format**: Shorter JWT (~300 chars)
- **Used by**: `internal-help-center-api.gorgias.com`
- **Contains**: `id`, `account_id`, `role`, `rules`, `iat`, `exp`
- **Expiration**: Shorter (30 min?)
- **Example**: `eyJhbGciOiJIUzI1NiIs...` (HS256)

### Token 3: Basic Auth
- **Format**: Username + API Key
- **Used by**: `{subdomain}.gorgias.com`
- **Username**: Email address
- **Password**: API Key from Settings → REST API

## Discovered Endpoints

### 1. Flows API ✅ WORKING

**Base**: `https://api.gorgias.work`

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/configurations` | GET | Bearer (Long JWT) | List all flows | ✅ Works |
| `/configurations?is_draft[]=0&is_draft[]=1` | GET | Bearer | Get drafts + published | ✅ Works |

**Example Response**:
```json
[
  {
    "internal_id": "01K96C6SHXD2P8YB9VJ37NX62Y",
    "id": "01K96C6SHXXSSSRZ1W85R55Z7P",
    "account_id": 155360,
    "name": "Issue Store Credit to Customer",
    "is_draft": false,
    "steps": [...],
    "inputs": [...],
    "transitions": [...]
  }
]
```

### 2. AI Agent Configuration API ✅ WORKING

**Base**: `https://aiagent.gorgias.help`

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/config/accounts/{account}/stores/{store}/configuration` | GET | Bearer (Long JWT) | Get AI Agent config | ✅ Works |
| `/api/config/accounts/{account}/stores/configurations` | GET | Bearer | Get all store configs | ✅ Works |

**Example Response**:
```json
{
  "storeConfiguration": {
    "storeName": "anton-savytski-test-store",
    "helpCenterId": 108213,
    "guidanceHelpCenterId": 79935,
    "snippetHelpCenterId": 79936,
    "toneOfVoice": "Sophisticated",
    ...
  }
}
```

### 3. Help Center API (Internal) 🔄 NEEDS TOKEN

**Base**: `https://internal-help-center-api.gorgias.com`

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/help-center/help-centers?type=guidance` | GET | Bearer (Short JWT) | List guidance help centers | 🔄 Token expired |

### 4. Main Gorgias API ⚠️ PARTIAL

**Base**: `https://{subdomain}.gorgias.com`

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/integrations` | GET | Basic Auth | List integrations | ✅ Works |
| `/api/account` | GET | Basic Auth | Get account info | ✅ Works |
| `/api/help-center/help-centers/{id}/guidances/ai/{store_id}` | GET | Basic Auth | Get AI guidances | ⚠️ 403 (wrong store_id) |
| `/gorgias-apps/auth` | POST | ??? | Get Bearer tokens | ❓ Unknown format |

## Current Blockers

### 1. Guidances API - Store Integration ID Unknown
- **Endpoint**: `/api/help-center/help-centers/79935/guidances/ai/{WHAT_ID}`
- **Problem**: Don't know the correct `store_integration_id`
- **Tried**: Store name, 0, 1 - all returned 403
- **Solution needed**: Find correct ID from integrations or another source

### 2. Bearer Token Generation
- **Endpoint**: `/{subdomain}.gorgias.com/gorgias-apps/auth`
- **Problem**: Don't know request format
- **Current**: Manual extraction from browser
- **Desired**: Programmatic token generation

### 3. Internal Help Center API Token
- **Different JWT**: Uses HS256 (not RS256)
- **Shorter expiration**: ~30 minutes
- **Source**: Unknown how to generate

## Working Configuration

```env
# Main API
GORGIAS_SUBDOMAIN=anton-gorgias-demo-store
GORGIAS_API_KEY=0626506fb93a1144f4b633702a620758041475a1e861e2ffd5ee142ed41ecef5
GORGIAS_USERNAME=anton.savytski@gorgias.com

# Flows/AI Agent API (manual from browser)
FLOWS_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIs... (Long JWT)

# Help Center
HELP_CENTER_ID=79935
STORE_NAME=anton-savytski-test-store
```

## Next Steps

1. **Find Store Integration ID**:
   - Check browser Network tab for actual ID used
   - OR query `/api/integrations` and find the right one
   - OR check AI Agent config for the ID

2. **Test Guidances Endpoint**:
   - Once we have correct store_integration_id
   - Test GET to see existing guidances
   - Test POST to create new guidances

3. **Automate Token Generation**:
   - Figure out `/gorgias-apps/auth` format
   - OR accept manual token refresh as workflow

## Recommended Approach

**Option A: Use What Works** ✅
- Flows: Use `api.gorgias.work` with manual Bearer token
- Guidances: Use main API once we find store_integration_id
- Accept: Manual token refresh every few hours

**Option B: Full Automation** 🔄
- Reverse-engineer token generation
- Build automated token refresh
- Complex but fully automated

**Option C: Hybrid** ⭐ RECOMMENDED
- Use Flows API with manual token (works now)
- Export flows to JSON for review
- Manually create guidances OR wait for Gorgias to provide API access
- Simpler, gets job done

---

**Last Updated**: November 24, 2025
**Total APIs Found**: 4
**Working Endpoints**: 6
**Blocked Endpoints**: 3
