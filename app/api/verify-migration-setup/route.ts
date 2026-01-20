import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'jsonwebtoken';
import axios from 'axios';

export async function POST(request: NextRequest) {
    const report: any = {
        checks: [],
        logs: [],
        success: false,
    };

    try {
        const body = await request.json();
        const { targetSubdomain, targetLongJWT } = body;

        report.logs.push(`Starting verification for subdomain: ${targetSubdomain}`);

        if (!targetLongJWT) {
            report.checks.push({ name: 'Input Validation', status: 'FAILED', error: 'Missing targetLongJWT' });
            return NextResponse.json(report, { status: 400 });
        }

        // 1. Decode Token
        let tokenAccountId: number | null = null;
        try {
            const decoded: any = decode(targetLongJWT);
            if (decoded && decoded.account_id) {
                tokenAccountId = decoded.account_id;
                report.checks.push({
                    name: 'Token Decode',
                    status: 'PASSED',
                    details: `Token Claims Account ID: ${tokenAccountId}`
                });
            } else {
                report.checks.push({ name: 'Token Decode', status: 'WARNING', details: 'Could not find account_id in token' });
            }
        } catch (e: any) {
            report.checks.push({ name: 'Token Decode', status: 'FAILED', error: e.message });
        }

        // 2. Client Setup
        const client = axios.create({
            baseURL: 'https://api.gorgias.work',
            headers: {
                'Authorization': `Bearer ${targetLongJWT}`,
                'Content-Type': 'application/json',
            },
        });

        // 3. Ground Truth Check
        let realAccountId: number | null = null;
        try {
            const resp = await client.get('/configurations');
            if (resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
                realAccountId = resp.data[0].account_id;
                report.checks.push({
                    name: 'Ground Truth Fetch',
                    status: 'PASSED',
                    details: `Real Account ID from existing flows: ${realAccountId}`
                });
            } else {
                report.checks.push({ name: 'Ground Truth Fetch', status: 'SKIPPED', details: 'No existing flows to check against.' });
            }
        } catch (e: any) {
            report.checks.push({
                name: 'Ground Truth Fetch',
                status: 'FAILED',
                error: `API Call Failed: ${e.message}`,
                details: e.response?.data
            });
            // If we can't even read, abort
            return NextResponse.json(report, { status: 500 });
        }

        // 4. Comparison
        const targetAccountId = realAccountId || tokenAccountId;
        if (tokenAccountId && realAccountId && tokenAccountId !== realAccountId) {
            report.checks.push({
                name: 'Account ID Mismatch Check',
                status: 'WARNING',
                details: `Token says ${tokenAccountId} but Real Data says ${realAccountId}. We will use Real ID: ${realAccountId}`
            });
        } else {
            report.checks.push({ name: 'Account ID Consensus', status: 'PASSED', details: `Using Account ID: ${targetAccountId}` });
        }

        if (!targetAccountId) {
            report.checks.push({ name: 'Critical', status: 'FAILED', error: 'Could not determine Target Account ID from Token OR Real Data.' });
            return NextResponse.json(report, { status: 400 });
        }

        // 5. Generate Test Flow
        const testId = generateULID();
        const entrypointTKey = generateULID();

        // Minimal Valid Payload (The "Mega Fix" Payload)
        const payload = {
            id: testId,
            internal_id: generateULID(),
            account_id: targetAccountId,
            name: '_Migration_Connection_Test_',
            is_draft: true,
            steps: [],
            transitions: [],
            initial_step_id: null, // Empty flow might need null or a dummy step? Let's try empty first.
            entrypoint: {
                label: '',
                label_tkey: entrypointTKey
            },
            available_languages: ['en-US'],
            triggers: [],
            entrypoints: [],
            apps: []
        } as any;

        // Wait, empty steps might be invalid. Let's make a dummy Step.
        const stepId = generateULID();
        payload.initial_step_id = stepId;
        payload.steps = [{
            id: stepId,
            kind: 'message',
            settings: {
                message: {
                    content: {
                        text: 'Test',
                        text_tkey: generateULID(),
                        html: '<p>Test</p>',
                        html_tkey: generateULID()
                    }
                }
            }
        }] as any;

        report.logs.push(`Attempting creation of flow ${testId} with Account ID ${targetAccountId}`);

        // 6. Test Write
        try {
            await client.put(`/configurations/${testId}`, payload);
            report.checks.push({ name: 'Write Test (PUT)', status: 'PASSED', details: `Created Flow ${testId}` });
        } catch (e: any) {
            report.checks.push({
                name: 'Write Test (PUT)',
                status: 'FAILED',
                error: e.message,
                details: e.response?.data
            });
            return NextResponse.json(report, { status: 200 }); // Return report even if failed
        }

        // 7. Test Read (Immediate Verification)
        try {
            const getResp = await client.get(`/configurations/${testId}`);
            if (getResp.status === 200) {
                report.checks.push({ name: 'Read Test (GET)', status: 'PASSED', details: 'Flow found immediately after creation.' });
            }
        } catch (e: any) {
            report.checks.push({ name: 'Read Test (GET)', status: 'FAILED', error: 'Created flow was NOT found (Ghost Issue persists).', details: e.message });
        }

        // 8. Cleanup
        try {
            await client.delete(`/configurations/${testId}`);
            report.logs.push('Cleanup successful.');
        } catch (e) {
            report.logs.push('Cleanup failed (Test flow might remain).');
        }

        report.success = !report.checks.some((c: any) => c.status === 'FAILED');
        return NextResponse.json(report);

    } catch (error: any) {
        report.error = error.message;
        return NextResponse.json(report, { status: 500 });
    }
}

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
