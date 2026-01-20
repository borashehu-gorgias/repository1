import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GorgiasAuth } from '@/lib/core/auth';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.accessToken || !session.gorgiasUsername || !session.gorgiasApiKey) {
      return NextResponse.json({ error: 'Missing authentication' }, { status: 401 });
    }

    // Get Bearer token
    const auth = new GorgiasAuth({
      gorgiasSubdomain: session.subdomain!,
      gorgiasApiKey: session.gorgiasApiKey,
      gorgiasUsername: session.gorgiasUsername,
      gorgiasClientId: process.env.GORGIAS_CLIENT_ID!,
      gorgiasClientSecret: process.env.GORGIAS_CLIENT_SECRET!,
      oauthRedirectUri: process.env.NEXT_PUBLIC_URL + '/api/auth/callback',
      logLevel: 'info',
      dryRun: false,
    });

    const bearerToken = await auth.getBearerToken();
    
    const testGuidance = {
      key: 'test_migration_001',
      name: 'Test Migration Guidance',
      content: 'This is a test guidance created by the migration tool.',
      batch_datetime: new Date().toISOString(),
      review_action: 'created' as const,
    };

    const results = {
      bearerTokenGenerated: true,
      tests: [] as any[],
    };

    // Test 1: POST to /guidances/ai/{store_id}
    try {
      const response = await axios.post(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers/79935/guidances/ai/35564`,
        [testGuidance],
        { headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
      );
      results.tests.push({ endpoint: 'POST /guidances/ai/{store_id}', status: 'SUCCESS', code: response.status });
    } catch (error: any) {
      results.tests.push({ endpoint: 'POST /guidances/ai/{store_id}', status: 'FAILED', code: error.response?.status, error: error.response?.data });
    }

    // Test 2: PUT to /guidances/ai/{store_id}
    try {
      const response = await axios.put(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers/79935/guidances/ai/35564`,
        [testGuidance],
        { headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
      );
      results.tests.push({ endpoint: 'PUT /guidances/ai/{store_id}', status: 'SUCCESS', code: response.status });
    } catch (error: any) {
      results.tests.push({ endpoint: 'PUT /guidances/ai/{store_id}', status: 'FAILED', code: error.response?.status, error: error.response?.data });
    }

    // Test 3: POST to /guidances (without /ai/{store_id})
    try {
      const response = await axios.post(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers/79935/guidances`,
        [testGuidance],
        { headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
      );
      results.tests.push({ endpoint: 'POST /guidances', status: 'SUCCESS', code: response.status });
    } catch (error: any) {
      results.tests.push({ endpoint: 'POST /guidances', status: 'FAILED', code: error.response?.status, error: error.response?.data });
    }

    // Test 4: POST to /guidances/{key}
    try {
      const response = await axios.post(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers/79935/guidances/${testGuidance.key}`,
        testGuidance,
        { headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
      );
      results.tests.push({ endpoint: 'POST /guidances/{key}', status: 'SUCCESS', code: response.status });
    } catch (error: any) {
      results.tests.push({ endpoint: 'POST /guidances/{key}', status: 'FAILED', code: error.response?.status, error: error.response?.data });
    }

    // Test 5: POST to ai-guidances endpoint
    try {
      const response = await axios.post(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers/79935/ai-guidances`,
        [testGuidance],
        { headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
      );
      results.tests.push({ endpoint: 'POST /ai-guidances', status: 'SUCCESS', code: response.status });
    } catch (error: any) {
      results.tests.push({ endpoint: 'POST /ai-guidances', status: 'FAILED', code: error.response?.status, error: error.response?.data });
    }

    const successCount = results.tests.filter(t => t.status === 'SUCCESS').length;

    return NextResponse.json({
      summary: `Tested ${results.tests.length} endpoint variations. ${successCount} succeeded.`,
      note: 'If all failed, check browser Network tab when creating a Guidance in Gorgias UI',
      results,
    });
  } catch (error: any) {
    console.error('Test error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

