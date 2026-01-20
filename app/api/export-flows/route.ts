import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

/**
 * Export flows as a downloadable JSON file
 * 
 * This endpoint fetches full flow data from the source account
 * and returns it in a format suitable for later import.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session.longJWT) {
            return NextResponse.json(
                { error: 'Long JWT required. Please authenticate first.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { flowIds } = body;

        if (!flowIds || !Array.isArray(flowIds) || flowIds.length === 0) {
            return NextResponse.json(
                { error: 'No flows selected for export' },
                { status: 400 }
            );
        }

        // Create client for source account
        const sourceClient = axios.create({
            baseURL: 'https://api.gorgias.work',
            headers: {
                'Authorization': `Bearer ${session.longJWT}`,
                'Content-Type': 'application/json',
            },
        });

        // Fetch full flow data for each selected flow
        const flowsPromises = flowIds.map((id) =>
            sourceClient.get(`/configurations/${id}`)
        );

        const flowsResponses = await Promise.all(flowsPromises);
        const flows = flowsResponses.map((r) => r.data);

        // Create export package
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            sourceSubdomain: session.subdomain || 'unknown',
            flowCount: flows.length,
            flows: flows,
        };

        return NextResponse.json(exportData);
    } catch (error: any) {
        console.error('Export error:', error.message);

        if (error.response?.status === 401) {
            return NextResponse.json(
                { error: 'Session expired. Please re-authenticate.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Export failed' },
            { status: 500 }
        );
    }
}
