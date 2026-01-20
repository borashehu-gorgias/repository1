import { decode } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Import flows from a previously exported JSON file
 * 
 * This endpoint accepts exported flow data and creates the flows
 * in the target account, regenerating all IDs and applying necessary
 * transformations (like choice label truncation).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { flows, targetLongJWT, targetShopName, targetIntegrationType } = body;

        // Validate inputs
        if (!flows || !Array.isArray(flows) || flows.length === 0) {
            return NextResponse.json(
                { error: 'No flows provided for import' },
                { status: 400 }
            );
        }

        if (!targetLongJWT || typeof targetLongJWT !== 'string') {
            return NextResponse.json(
                { error: 'Target account Long JWT is required' },
                { status: 400 }
            );
        }

        if (!targetLongJWT.startsWith('eyJ')) {
            return NextResponse.json(
                { error: 'Invalid Long JWT format. Token should start with "eyJ"' },
                { status: 400 }
            );
        }

        // Create clients for target account
        const targetClient = axios.create({
            baseURL: 'https://api.gorgias.work',
            headers: {
                'Authorization': `Bearer ${targetLongJWT}`,
                'Content-Type': 'application/json',
            },
        });

        const chatClient = axios.create({
            baseURL: 'https://us-east1-898b.gorgias.chat',
            headers: {
                'Authorization': `Bearer ${targetLongJWT}`,
                'Content-Type': 'application/json',
            },
        });

        const shopName = targetShopName || '';
        const integrationType = targetIntegrationType || 'shopify';

        // Get target account ID
        let targetAccountId: number;
        try {
            const check = await targetClient.get('/configurations');
            if (check.data && Array.isArray(check.data) && check.data.length > 0) {
                targetAccountId = check.data[0].account_id;
                console.log(`[Import] Found Account ID from existing flows: ${targetAccountId}`);
            } else {
                console.log('[Import] No existing flows found, falling back to Token ID');
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

        // Import each flow
        const results: any[] = [];

        for (const flow of flows) {
            try {
                console.log(`[Import] Processing flow: ${flow.name || flow.id}`);

                // Prepare flow for target account
                const { payload, newFlowId } = prepareFlowForImport(flow, targetAccountId);

                console.log(`[Import] Creating flow ${newFlowId} via PUT in account ${targetAccountId}`);
                const response = await targetClient.put(`/configurations/${newFlowId}`, payload);

                const createdFlowId = response.data?.id || newFlowId;

                // Verify flow exists
                await targetClient.get(`/configurations/${createdFlowId}`);
                console.log(`[Import] Verified flow ${createdFlowId} exists.`);

                // Register with shop if provided
                let shopRegistrationSuccess = false;
                if (shopName) {
                    try {
                        const shopConfigUrl = `/ssp/helpdesk/configurations?shop_name=${encodeURIComponent(shopName)}&type=${integrationType}`;
                        const shopConfigResponse = await chatClient.get(shopConfigUrl);
                        const shopConfig = shopConfigResponse.data;

                        const workflowsEntrypoints = shopConfig.workflowsEntrypoints || [];
                        const alreadyExists = workflowsEntrypoints.some((e: any) => e.workflow_id === createdFlowId);

                        if (!alreadyExists) {
                            workflowsEntrypoints.push({ workflow_id: createdFlowId });
                            shopConfig.workflowsEntrypoints = workflowsEntrypoints;
                            await chatClient.put(shopConfigUrl, shopConfig);
                            shopRegistrationSuccess = true;
                        } else {
                            shopRegistrationSuccess = true;
                        }
                    } catch (shopErr: any) {
                        console.error(`[Import] Shop registration failed: ${shopErr.message}`);
                    }
                }

                results.push({
                    originalId: flow.id,
                    name: flow.name,
                    success: true,
                    newId: createdFlowId,
                    shopRegistered: shopRegistrationSuccess,
                });
            } catch (error: any) {
                console.error(`[Import] Failed to import flow ${flow.name || flow.id}:`, error.message);
                if (error.response?.data) {
                    console.error('[Import] API Error:', JSON.stringify(error.response.data, null, 2));
                }

                results.push({
                    originalId: flow.id,
                    name: flow.name,
                    success: false,
                    error: error.response?.data?.message || error.message,
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
            },
            results,
        });
    } catch (error: any) {
        console.error('Import error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Import failed' },
            { status: 500 }
        );
    }
}

// Helper functions (same as migrate-to-account)

function generateULID(): string {
    const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    const time = Date.now();
    let timeStr = '';
    let t = time;
    for (let i = 0; i < 10; i++) {
        const mod = t % 32;
        timeStr = CROCKFORD_BASE32[mod] + timeStr;
        t = Math.floor(t / 32);
    }

    let randomStr = '';
    for (let i = 0; i < 16; i++) {
        randomStr += CROCKFORD_BASE32[Math.floor(Math.random() * 32)];
    }

    return '01' + timeStr.padStart(8, '0').slice(-8) + randomStr;
}

function prepareFlowForImport(flow: any, targetAccountId: number): { payload: any, newFlowId: string } {
    const newFlowId = generateULID();
    const newInternalId = generateULID();

    // Create ID mapping for steps
    const stepIdMap = new Map<string, string>();
    if (flow.steps && Array.isArray(flow.steps)) {
        flow.steps.forEach((step: any) => {
            stepIdMap.set(step.id, generateULID());
        });
    }

    // Remap Steps with choice label truncation
    const newSteps = (flow.steps || []).map((step: any) => {
        const newStepId = stepIdMap.get(step.id);
        const newStep = {
            ...step,
            id: newStepId,
        };

        // Truncate choice labels that exceed 50 characters
        if (newStep.settings?.choices && Array.isArray(newStep.settings.choices)) {
            newStep.settings = {
                ...newStep.settings,
                choices: newStep.settings.choices.map((choice: any) => {
                    if (choice.label && typeof choice.label === 'string' && choice.label.length > 50) {
                        console.log(`[Import] Truncating choice label from ${choice.label.length} to 50 chars`);
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
            id: generateULID(),
            to_step_id: stepIdMap.get(transition.to_step_id) || transition.to_step_id,
            from_step_id: stepIdMap.get(transition.from_step_id) || transition.from_step_id,
        };
    });

    const newInitialStepId = stepIdMap.get(flow.initial_step_id) || flow.initial_step_id;

    const entrypoint = flow.entrypoint || { label: '' };
    const newEntrypoint = {
        ...entrypoint,
        label_tkey: generateULID(),
    };

    const payload: any = {
        id: newFlowId,
        internal_id: newInternalId,
        account_id: targetAccountId,
        name: flow.name || 'Imported Flow',
        is_draft: true,
        steps: newSteps,
        transitions: newTransitions,
        initial_step_id: newInitialStepId,
        entrypoint: newEntrypoint,
        available_languages: flow.available_languages || ['en-US'],
        triggers: flow.triggers || [],
        entrypoints: flow.entrypoints || [],
        apps: flow.apps || [],
    };

    if (flow.description) payload.description = flow.description;
    if (flow.short_description) payload.short_description = flow.short_description;
    if (flow.inputs) payload.inputs = flow.inputs;
    if (flow.values) payload.values = flow.values;
    if (flow.category) payload.category = flow.category;

    let cleanedPayload = cleanPayload(regenerateTKeys(payload));

    // CRITICAL: Replace all old step ID references with new step IDs
    // This fixes variable references in templates, conditions, HTTP bodies, etc.
    let payloadString = JSON.stringify(cleanedPayload);
    for (const [oldId, newId] of stepIdMap) {
        payloadString = payloadString.split(oldId).join(newId);
    }
    cleanedPayload = JSON.parse(payloadString);

    cleanedPayload.account_id = targetAccountId;

    return { payload: cleanedPayload, newFlowId };
}

function regenerateTKeys(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => regenerateTKeys(item));

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

function cleanPayload(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => cleanPayload(item));

    const newObj: any = {};
    const forbiddenKeys = ['created_at', 'updated_at', 'deleted_at', 'account_id'];

    for (const key in obj) {
        if (!forbiddenKeys.includes(key)) {
            newObj[key] = cleanPayload(obj[key]);
        }
    }
    return newObj;
}
