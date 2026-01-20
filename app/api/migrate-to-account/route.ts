import { decode } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

/**
 * Migrate flows to another Gorgias account
 *
 * This endpoint:
 * 1. Fetches full flow data from source account (using session's Long JWT)
 * 2. POSTs each flow to target account (using provided target Long JWT)
 *
 * Target credentials are used only in memory and never persisted.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.longJWT) {
      return NextResponse.json(
        { error: 'Source account Long JWT required. Please authenticate first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { flowIds, targetSubdomain, targetLongJWT, targetShopName, targetIntegrationType } = body;

    // Validate inputs
    if (!flowIds || !Array.isArray(flowIds) || flowIds.length === 0) {
      return NextResponse.json(
        { error: 'No flows selected for migration' },
        { status: 400 }
      );
    }

    if (!targetSubdomain || typeof targetSubdomain !== 'string') {
      return NextResponse.json(
        { error: 'Target subdomain is required' },
        { status: 400 }
      );
    }

    if (!targetLongJWT || typeof targetLongJWT !== 'string') {
      return NextResponse.json(
        { error: 'Target account Long JWT is required' },
        { status: 400 }
      );
    }

    // Validate target JWT format (basic check)
    if (!targetLongJWT.startsWith('eyJ')) {
      return NextResponse.json(
        { error: 'Invalid Long JWT format. Token should start with "eyJ"' },
        { status: 400 }
      );
    }

    // Create clients for source and target accounts
    const sourceClient = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${session.longJWT}`,
        'Content-Type': 'application/json',
      },
    });

    const targetClient = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${targetLongJWT}`,
        'Content-Type': 'application/json',
      },
    });

    // Client for the shop integration registration endpoint (gorgias.chat)
    // This is required to make flows appear in the UI
    const chatClient = axios.create({
      baseURL: 'https://us-east1-898b.gorgias.chat',
      headers: {
        'Authorization': `Bearer ${targetLongJWT}`,
        'Content-Type': 'application/json',
      },
    });

    // Shop integration info (required to register flows with a store)
    const shopName = targetShopName || '';
    const integrationType = targetIntegrationType || 'shopify';

    // 1. Validate Target Token & Fetch Account Context (Ground Truth)
    let targetAccountId: number;
    try {
      // Try to get account_id from existing flows (Most reliable source)
      const check = await targetClient.get('/configurations');
      if (check.data && Array.isArray(check.data) && check.data.length > 0) {
        targetAccountId = check.data[0].account_id;
        console.log(`[Migration] Found Account ID from existing flows: ${targetAccountId}`);
      } else {
        // Fallback to token decoding if no flows exist
        console.log('[Migration] No existing flows found, falling back to Token ID');
        const decodedToken: any = decode(targetLongJWT);
        if (!decodedToken || !decodedToken.account_id) {
          return NextResponse.json(
            { error: 'Invalid Target JWT: Could not extract account_id' },
            { status: 400 }
          );
        }
        targetAccountId = decodedToken.account_id;
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: 'Target account Long JWT is invalid or expired.' },
          { status: 401 }
        );
      }
      throw error;
    }

    // Fetch full flow data from source account
    const flowsPromises = flowIds.map((id) =>
      sourceClient.get(`/configurations/${id}`)
    );

    const flowsResponses = await Promise.all(flowsPromises);
    const flows = flowsResponses.map((r) => r.data);

    // Migrate each flow to target account
    const results: any[] = [];

    for (const flow of flows) {
      try {
        // DEBUG: Log what we received from source
        console.log(`[Migration] Source flow ${flow.id} has:`, {
          steps: flow.steps?.length ?? 'NULL',
          transitions: flow.transitions?.length ?? 'NULL',
          initial_step_id: flow.initial_step_id ?? 'NULL'
        });

        // Prepare flow for target account
        const { payload, newFlowId } = prepareFlowForMigration(flow, targetAccountId);

        // DEBUG: Log what we're about to send
        console.log(`[Migration] Payload for ${newFlowId}:`, {
          hasSteps: !!payload.steps,
          stepsLength: payload.steps?.length ?? 'NULL',
          hasTransitions: !!payload.transitions,
          transitionsLength: payload.transitions?.length ?? 'NULL',
          initialStepId: payload.initial_step_id ?? 'NULL',
          accountId: payload.account_id
        });

        // Attempt to create flow in target account using PUT
        console.log(`[Migration] Creating flow ${newFlowId} via PUT in account ${targetAccountId}`);
        const response = await targetClient.put(`/configurations/${newFlowId}`, payload);

        // DEBUG: Log what the API returned
        console.log(`[Migration] API Response for ${newFlowId}:`, {
          status: response.status,
          responseHasSteps: !!response.data?.steps,
          responseStepsLength: response.data?.steps?.length ?? 'NULL',
          responseInitialStepId: response.data?.initial_step_id ?? 'NULL'
        });

        // Get the actual ID assigned by the API (may differ from our generated newFlowId)
        const createdFlowId = response.data?.id || newFlowId;
        const createdInternalId = response.data?.internal_id || 'unknown';

        console.log(`[Migration] Created flow with id=${createdFlowId}, internal_id=${createdInternalId}`);
        console.log(`[Migration] IDs different? ${createdFlowId !== createdInternalId}`);

        // VERIFICATION: Check if it actually exists
        try {
          await targetClient.get(`/configurations/${createdFlowId}`);
          console.log(`[Migration] Verified flow ${createdFlowId} exists.`);
        } catch (verifyErr) {
          console.error(`[Migration] Verification FAILED for ${createdFlowId}`);
          throw new Error(`API returned 200 but Flow was not found on read-back.`);
        }

        // REGISTER FLOW WITH SHOP INTEGRATION
        // This is the critical step that makes flows appear in the Gorgias UI
        let shopRegistrationSuccess = false;
        if (shopName) {
          try {
            console.log(`[Migration] Registering flow with shop: ${shopName} (type: ${integrationType})`);

            // 1. Fetch current shop configuration
            const shopConfigUrl = `/ssp/helpdesk/configurations?shop_name=${encodeURIComponent(shopName)}&type=${integrationType}`;
            const shopConfigResponse = await chatClient.get(shopConfigUrl);
            const shopConfig = shopConfigResponse.data;

            console.log(`[Migration] Fetched shop config, current workflow count: ${shopConfig?.workflowsEntrypoints?.length || 0}`);

            // 2. Add the new flow to workflowsEntrypoints
            const workflowsEntrypoints = shopConfig.workflowsEntrypoints || [];
            const alreadyExists = workflowsEntrypoints.some((e: any) => e.workflow_id === createdFlowId);

            if (!alreadyExists) {
              workflowsEntrypoints.push({ workflow_id: createdFlowId });
              shopConfig.workflowsEntrypoints = workflowsEntrypoints;

              // 3. PUT the updated configuration back
              const updateResponse = await chatClient.put(shopConfigUrl, shopConfig);
              console.log(`[Migration] Shop registration succeeded with status ${updateResponse.status}`);
              console.log(`[Migration] New workflow count: ${updateResponse.data?.workflowsEntrypoints?.length || 0}`);
              shopRegistrationSuccess = true;
            } else {
              console.log(`[Migration] Flow ${createdFlowId} already registered with shop`);
              shopRegistrationSuccess = true;
            }
          } catch (shopErr: any) {
            console.error(`[Migration] Shop registration FAILED: ${shopErr.message}`);
            if (shopErr.response?.data) {
              console.error(`[Migration] Shop error details:`, JSON.stringify(shopErr.response.data, null, 2));
            }
          }
        } else {
          console.warn(`[Migration] No shop name provided - flow created but NOT registered with any shop integration!`);
        }

        results.push({
          sourceId: flow.id,
          name: flow.name,
          success: true,
          targetId: createdFlowId,
          targetInternalId: createdInternalId,
          idsDifferent: createdFlowId !== createdInternalId,
          shopRegistered: shopRegistrationSuccess,
          targetAccountIdUsed: targetAccountId,
          status: response.status,
          debug: {
            generatedId: newFlowId,
            apiReturnedId: createdFlowId,
            accountId: targetAccountId,
            shopName: shopName || 'NOT PROVIDED'
          }
        });
      } catch (error: any) {
        console.error(`Failed to migrate flow ${flow.id}:`, error.message);

        // Log detailed error from API for debugging
        if (error.response?.data) {
          console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        }

        results.push({
          sourceId: flow.id,
          name: flow.name,
          success: false,
          error: error.response?.data?.message || error.response?.data?.error || error.message,
          status: error.response?.status,
          details: error.response?.data,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      summary: {
        total: flows.length,
        succeeded: successCount,
        failed: failureCount,
        targetSubdomain,
      },
      results,
    });
  } catch (error: any) {
    // ... catch block
    console.error('Migration error:', error.message);

    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }

    return NextResponse.json(
      {
        error: error.message || 'Migration failed',
        details: error.response?.data,
      },
      { status: 500 }
    );
  }
}

// Helper to generate ULIDs (Crockford's Base32 Timestamp + Random)
function generateULID(): string {
  const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  // 1. Generate Timestamp Part (10 chars, ample for many years)
  // We use current time to ensure the ID is sorted correctly ("Now")
  const time = Date.now();
  let timeStr = '';
  // Convert time to base32
  let t = time;
  // We want 10 chars for timestamp to match typical ULID-ish length prefix
  // Standard ULID time is 48 bits (10 chars in base32)
  for (let i = 0; i < 10; i++) {
    const mod = t % 32;
    timeStr = CROCKFORD_BASE32[mod] + timeStr;
    t = Math.floor(t / 32);
  }

  // 2. Generate Random Part (16 chars)
  let randomStr = '';
  for (let i = 0; i < 16; i++) {
    randomStr += CROCKFORD_BASE32[Math.floor(Math.random() * 32)];
  }

  // Gorgias flow IDs start with 01 usually, but let's stick to pure ULID logic 
  // or prepend '01' if strictly required. 
  // User ID: 01KCPMK64Y... 
  // 01KCP... is basically a ULID. KCP... encodes the time.
  // We will trust standard ULID generation logic but ensure 26 chars length.
  // Actually, let's match their format: '01' + Timestamp(8 chars) + Random(16 chars)
  // '01' seems static. 
  // Let's generate a proper ULID-like string matching the user's example.

  // Re-doing timestamp for 8 chars (since 01 takes 2 chars, total 26)
  // User ID: 01KCPMK64Y (10 chars) ... wait
  // User ID: 01 KCPMK64Y A534Q5K9RYKF0W54  (26 chars)
  // 01 is likely version/prefix.
  // KCPMK64Y is time.

  return '01' + timeStr.padStart(8, '0').slice(-8) + randomStr;
}

/**
 * Prepare a flow configuration for migration to another account
 * Removes source-specific identifiers and adjusts the payload
 * Regenerates all IDs to ensure clean import via PUT
 */
function prepareFlowForMigration(flow: any, targetAccountId: number): { payload: any, newFlowId: string } {
  const newFlowId = generateULID();
  // Generate a DIFFERENT internal_id - call generateULID again for a different random portion
  const newInternalId = generateULID();

  // Create a map of old Step ID -> new Step ID
  const stepIdMap = new Map<string, string>();

  if (flow.steps && Array.isArray(flow.steps)) {
    flow.steps.forEach((step: any) => {
      stepIdMap.set(step.id, generateULID());
    });
  }

  // Remap Steps (with choice label truncation)
  const newSteps = (flow.steps || []).map((step: any) => {
    const newStepId = stepIdMap.get(step.id);
    const newStep = {
      ...step,
      id: newStepId,
    };

    // Truncate choice labels that exceed 50 characters (API limit)
    if (newStep.settings?.choices && Array.isArray(newStep.settings.choices)) {
      newStep.settings = {
        ...newStep.settings,
        choices: newStep.settings.choices.map((choice: any) => {
          if (choice.label && typeof choice.label === 'string' && choice.label.length > 50) {
            console.log(`[Migration] Truncating choice label from ${choice.label.length} to 50 chars: "${choice.label.substring(0, 30)}..."`);
            return {
              ...choice,
              label: choice.label.substring(0, 47) + '...',
            };
          }
          return choice;
        }),
      };
    }

    return newStep;
  });

  // Remap Transitions
  const newTransitions = (flow.transitions || []).map((transition: any) => {
    return {
      ...transition,
      id: generateULID(), // New ID for transition itself
      to_step_id: stepIdMap.get(transition.to_step_id) || transition.to_step_id,
      from_step_id: stepIdMap.get(transition.from_step_id) || transition.from_step_id,
    };
  });

  // Remap Initial Step ID
  const newInitialStepId = stepIdMap.get(flow.initial_step_id) || flow.initial_step_id;

  // Prepare entrypoint with required tkey
  const entrypoint = flow.entrypoint || { label: '' };
  const newEntrypoint = {
    ...entrypoint,
    label_tkey: generateULID(),
  };


  // Build the payload matching the exact structure from manual request
  // Include both id and internal_id - they should be DIFFERENT
  const payload: any = {
    id: newFlowId,
    internal_id: newInternalId,  // Explicitly different from id
    account_id: targetAccountId, // Explicitly set target account ID

    // Required fields
    name: flow.name || 'Migrated Flow',
    is_draft: true, // Always create as draft for safety

    // Steps with new IDs
    steps: newSteps,

    // Transitions with new IDs
    transitions: newTransitions,

    // Initial step ID with new ID
    initial_step_id: newInitialStepId,

    // Entrypoint configuration
    entrypoint: newEntrypoint,

    // Available languages
    available_languages: flow.available_languages || ['en-US'],

    // Preserve triggers, entrypoints, and apps from original flow
    triggers: flow.triggers || [],
    entrypoints: flow.entrypoints || [],
    apps: flow.apps || [],
  };

  // Optional fields
  if (flow.description) payload.description = flow.description;
  if (flow.short_description) payload.short_description = flow.short_description;
  if (flow.inputs) payload.inputs = flow.inputs;
  if (flow.values) payload.values = flow.values;
  if (flow.category) payload.category = flow.category;

  // Proactively regenerate all tkeys and clean metadata from nested objects
  let cleanedPayload = cleanPayload(regenerateTKeys(payload));

  // CRITICAL: Replace all old step ID references with new step IDs
  // This fixes variable references in templates, conditions, HTTP bodies, etc.
  let payloadString = JSON.stringify(cleanedPayload);
  for (const [oldId, newId] of stepIdMap) {
    payloadString = payloadString.split(oldId).join(newId);
  }
  cleanedPayload = JSON.parse(payloadString);

  // CRITICAL: Re-add the top-level account_id after cleaning
  // (cleanPayload strips ALL account_id fields, but we need the top-level one)
  cleanedPayload.account_id = targetAccountId;

  return { payload: cleanedPayload, newFlowId };
}

/**
 * Recursively regenerate any keys ending in _tkey
 * preventing missing required translation keys
 */
function regenerateTKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => regenerateTKeys(item));
  }

  const newObj: any = {};
  for (const key in obj) {
    if (key.endsWith('_tkey')) {
      newObj[key] = generateULID();
    } else {
      newObj[key] = regenerateTKeys(obj[key]);
    }
  }
  return newObj;
}

/**
 * Recursively remove specific separate metadata fields that might pollute the target object
 * (account_id, created_at, updated_at, deleted_at)
 * Exception: The top-level 'account_id' is manually added later, so this cleans nested ones.
 */
function cleanPayload(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanPayload(item));
  }

  const newObj: any = {};
  const forbiddenKeys = ['created_at', 'updated_at', 'deleted_at', 'account_id'];

  for (const key in obj) {
    if (!forbiddenKeys.includes(key)) {
      newObj[key] = cleanPayload(obj[key]);
    }
  }
  return newObj;
}
