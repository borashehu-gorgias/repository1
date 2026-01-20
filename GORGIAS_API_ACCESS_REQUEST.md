# Gorgias Flows to Guidance Migration App
## Technical Documentation & API Access Request

**Document Version:** 1.0  
**Date:** December 5, 2025  
**Author:** Anton Savytski  
**App Name:** Gorgias Flows to Guidance  
**Partner App ID:** 69250a5b8403d51a13c68d98

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Business Problem](#business-problem)
3. [End-User Use Case](#end-user-use-case)
4. [Technical Architecture](#technical-architecture)
5. [API Requirements](#api-requirements)
6. [Current Blocker](#current-blocker)
7. [Proposed Solutions](#proposed-solutions)
8. [Appendix](#appendix)

---

## Executive Summary

We are building a migration tool that helps Gorgias customers **automatically convert their existing Flows into AI Guidances**. This addresses the transition from the legacy Flows system to the new AI Agent-powered Guidances system.

**The Problem:** The Flows API (`api.gorgias.work/configurations`) requires a 1st-party JWT token that cannot be obtained programmatically via OAuth2, forcing users to manually copy tokens from browser dev tools.

**The Ask:** We need either:
1. OAuth2 access to the Flows API, OR
2. A programmatic way to obtain the required JWT token, OR
3. An alternative endpoint to fetch Flow configurations

---

## Business Problem

### Context
Gorgias has been transitioning customers from **Flows** (rule-based automation) to **AI Guidances** (AI Agent-powered responses). Many customers have invested significant time building complex Flows and need an efficient way to migrate this knowledge to the new system.

### Pain Points for Customers
1. **Manual Migration is Time-Consuming:** Customers must manually recreate each Flow as a Guidance
2. **Knowledge Loss Risk:** Complex Flow logic may be lost or incorrectly translated during manual migration
3. **Adoption Barrier:** The effort required to migrate slows down AI Agent adoption

### Our Solution
An automated migration tool that:
- Fetches all existing Flows from a customer's account
- Parses the Flow JSON structure (nodes, conditions, responses)
- Uses AI (LLM) to intelligently convert Flow logic into well-structured Guidances
- Creates the Guidances via the Help Center API

---

## End-User Use Case

### User Persona
- **Role:** Gorgias Admin or Support Manager
- **Goal:** Migrate existing Flows to AI Guidances without manual recreation
- **Technical Level:** Non-technical (should not require dev tools access)

### Ideal User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. USER VISITS APP                                                 │
│     └─> Enters Gorgias subdomain (e.g., "acme")                    │
├─────────────────────────────────────────────────────────────────────┤
│  2. OAUTH2 AUTHENTICATION                                           │
│     └─> User approves scopes, app receives access token            │
├─────────────────────────────────────────────────────────────────────┤
│  3. FLOWS ARE FETCHED  ⚠️ BLOCKER HERE                              │
│     └─> App calls Flows API to retrieve all configurations         │
├─────────────────────────────────────────────────────────────────────┤
│  4. USER SELECTS FLOWS TO MIGRATE                                   │
│     └─> UI displays Flows, user selects which ones to convert      │
├─────────────────────────────────────────────────────────────────────┤
│  5. AI CONVERSION                                                   │
│     └─> LLM parses Flow JSON and generates Guidance content        │
├─────────────────────────────────────────────────────────────────────┤
│  6. GUIDANCES CREATED                                               │
│     └─> App creates Guidances via Help Center API                  │
├─────────────────────────────────────────────────────────────────────┤
│  7. SUCCESS                                                         │
│     └─> User sees migrated Guidances in their Gorgias dashboard    │
└─────────────────────────────────────────────────────────────────────┘
```

### Current User Journey (With Workaround)

Due to the API limitation, users must currently:

1. ✅ Visit app and enter subdomain
2. ✅ Complete OAuth2 authentication
3. ⚠️ **Manual Step Required:**
   - Open Gorgias dashboard in browser
   - Open Developer Tools (F12)
   - Navigate to Network tab
   - Find any request to `api.gorgias.work`
   - Copy the Bearer token from Authorization header
   - Paste token into our app
4. ✅ Select Flows to migrate
5. ✅ AI conversion runs
6. ✅ Guidances are created

**This manual step is a significant UX barrier** and makes the app unsuitable for non-technical users.

---

## Technical Architecture

### System Overview

```
┌──────────────────┐     OAuth2      ┌──────────────────┐
│                  │ ◄─────────────► │                  │
│   Migration App  │                 │  Gorgias OAuth   │
│   (Next.js)      │                 │  Server          │
│                  │                 │                  │
└────────┬─────────┘                 └──────────────────┘
         │
         │  ❌ OAuth token doesn't work
         ▼
┌──────────────────┐                 ┌──────────────────┐
│                  │  Long JWT       │                  │
│  api.gorgias.work│ ◄───────────── │  /gorgias-apps/  │
│  /configurations │  (1st party)    │  auth            │
│                  │                 │  (browser only)  │
└──────────────────┘                 └──────────────────┘
         │
         │  Flow JSON
         ▼
┌──────────────────┐
│                  │
│   LLM (OpenRouter│
│   Grok 4.1)      │
│                  │
└────────┬─────────┘
         │
         │  Formatted Guidance
         ▼
┌──────────────────┐     Short JWT   ┌──────────────────┐
│  internal-help-  │ ◄───────────── │  Basic Auth      │
│  center-api.     │  (via Basic    │  (username +     │
│  gorgias.com     │   Auth)        │   API key)       │
└──────────────────┘                 └──────────────────┘
```

### Technology Stack
- **Frontend/Backend:** Next.js 15 (App Router)
- **Hosting:** Vercel
- **Session Management:** iron-session (encrypted cookies)
- **AI Processing:** OpenRouter (Grok 4.1 Fast)

---

## API Requirements

### APIs We Successfully Use

| API | Endpoint | Auth Method | Status |
|-----|----------|-------------|--------|
| Help Center API | `internal-help-center-api.gorgias.com` | Short JWT (via Basic Auth) | ✅ Working |
| OAuth2 | `{subdomain}.gorgias.com/oauth/authorize` | OAuth2 | ✅ Working |

### API We Need Access To

| API | Endpoint | Required Auth | Status |
|-----|----------|---------------|--------|
| Flows API | `api.gorgias.work/configurations` | Long JWT (~900 chars) | ❌ Blocked |

---

## Current Blocker

### The Problem

The Flows API at `api.gorgias.work/configurations` **does not accept OAuth2 tokens**.

#### What We Tried

| Attempt | Result |
|---------|--------|
| OAuth2 Bearer token | `500 Internal Server Error` |
| OAuth2 with `write:all` scope | `500 Internal Server Error` |
| OAuth2 with `flows:read` scope | `invalid_scope` error |
| Basic Auth (API key) | `500 Internal Server Error` |
| Call `/gorgias-apps/auth` from backend | `401: Authentication via 'Authorization' header is only available on API endpoints` |

#### What Works

The **only** authentication that works is the Long JWT obtained from `/gorgias-apps/auth`, which requires:
- Active browser session (cookies)
- CSRF token (from browser session)

This endpoint is designed for 1st-party browser applications and cannot be called programmatically from a 3rd-party app.

### Token Comparison

| Token Type | Length | Source | Works with api.gorgias.work |
|------------|--------|--------|----------------------------|
| OAuth2 access_token | ~300 chars | OAuth2 flow | ❌ No |
| API Key Bearer | ~64 chars | Basic Auth exchange | ❌ No |
| Long JWT | ~900 chars | `/gorgias-apps/auth` (browser only) | ✅ Yes |

---

## Proposed Solutions

We see three potential paths forward:

### Option A: Add Flows to OAuth2 Scopes (Preferred)
Add a new OAuth2 scope (e.g., `flows:read`) that grants access to `api.gorgias.work/configurations`.

**Pros:**
- Follows existing OAuth2 patterns
- No changes needed to existing security model
- Partner apps can request this scope during installation

**Cons:**
- Requires OAuth2 scope registry changes

### Option B: Alternative Flows Endpoint
Expose Flow configurations via the standard API (`{subdomain}.gorgias.com/api/flows` or similar) that accepts OAuth2 tokens.

**Pros:**
- Consistent with other Gorgias APIs
- No special token handling required

**Cons:**
- May require building a new API endpoint

### Option C: Allow Programmatic Access to Long JWT
Enable a way for authenticated OAuth2 apps to exchange their token for the Long JWT needed for `api.gorgias.work`.

**Pros:**
- Works with existing infrastructure

**Cons:**
- May have security implications
- Blurs line between 1st and 3rd party access

---

## Appendix

### A. OAuth2 Scopes Currently Requested

```
openid email profile offline write:all
```

### B. Sample Flow JSON Structure

```json
{
  "id": "01K8P612VH9KEY6TQ2M671N4B0",
  "name": "Product Authenticity Check",
  "steps": [
    {
      "id": "step_1",
      "type": "message",
      "content": "All our products are 100% authentic..."
    },
    {
      "id": "step_2", 
      "type": "condition",
      "conditions": [...]
    }
  ],
  "inputs": [...],
  "outputs": [...]
}
```

### C. Sample Guidance Output

```markdown
# Product Authenticity Check

## When to Use
When a customer asks about product authenticity or legitimacy.

## Response Guidelines
- Confirm all products are 100% authentic
- Explain sourcing directly from brands
- Offer to provide authenticity documentation if requested

## Key Points
- We are an authorized retailer
- Products come with original packaging
- Warranty is honored by manufacturer
```

### D. Loom Demo

MVP demonstration showing current flow (including manual token step):
https://www.loom.com/share/3ad7b6875ccf400a906f6d454c1caddf

### E. Repository

Source code available at: https://github.com/anton/gorgias-flows-migrator
(Can provide access if needed)

---

## Contact

**Anton Savytski**  
Email: [your-email]  
Slack: @Anton Savytski

---

*Thank you for taking the time to review this documentation. We believe this tool would significantly improve the customer experience during the Flows → Guidances transition, and we're eager to find a solution that works within Gorgias's security model.*

