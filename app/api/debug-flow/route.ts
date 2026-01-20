import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

/**
 * Debug endpoint to show exactly what we get when fetching a flow
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session.longJWT) {
            return NextResponse.json({ error: 'No Long JWT in session' }, { status: 401 });
        }

        const body = await request.json();
        const { flowId } = body;

        if (!flowId) {
            return NextResponse.json({ error: 'flowId required' }, { status: 400 });
        }

        // Fetch the flow
        const response = await axios.get(
            `https://api.gorgias.work/configurations/${flowId}`,
            {
                headers: {
                    'Authorization': `Bearer ${session.longJWT}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const flow = response.data;

        return NextResponse.json({
            flowId,
            hasSteps: !!flow.steps,
            stepsLength: flow.steps?.length ?? 'NULL',
            hasTransitions: !!flow.transitions,
            transitionsLength: flow.transitions?.length ?? 'NULL',
            initialStepId: flow.initial_step_id ?? 'NULL',
            name: flow.name,
            accountId: flow.account_id,
            // Show first step as sample
            firstStep: flow.steps?.[0] ?? null,
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
        }, { status: 500 });
    }
}
