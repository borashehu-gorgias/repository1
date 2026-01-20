import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.longJWT) {
      return NextResponse.json({ error: 'No Long JWT found' }, { status: 401 });
    }

    // Get flow ID from query param
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('id') || '01K8W19F6QN4T141CAJVPW68ED'; // Default to the empty one

    // Fetch the specific flow
    const response = await axios.get(
      `https://api.gorgias.work/configurations/${flowId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.longJWT}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({
      flowId,
      structure: response.data,
      availableFields: Object.keys(response.data),
      stepsCount: response.data.steps?.length || 0,
      inputsCount: response.data.inputs?.length || 0,
      transitionsCount: response.data.transitions?.length || 0,
      note: 'Check the structure to see all available fields and nested data',
    }, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

