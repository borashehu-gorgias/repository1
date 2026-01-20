import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const results = {
      subdomain: session.subdomain,
      tokenLength: session.accessToken.length,
      tests: [] as any[],
    };

    // Test 1: Get help centers
    try {
      console.log('Test 1: Getting help centers...');
      const helpCentersResponse = await axios.get(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      results.tests.push({
        name: 'List Help Centers',
        status: 'SUCCESS',
        statusCode: helpCentersResponse.status,
        data: helpCentersResponse.data,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'List Help Centers',
        status: 'FAILED',
        statusCode: error.response?.status,
        error: error.response?.data || error.message,
      });
    }

    // Test 2: Get integrations
    try {
      console.log('Test 2: Getting integrations...');
      const integrationsResponse = await axios.get(
        `https://${session.subdomain}.gorgias.com/api/integrations`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const shopifyIntegrations = integrationsResponse.data.data.filter(
        (i: any) => i.type === 'shopify'
      );
      
      results.tests.push({
        name: 'List Integrations',
        status: 'SUCCESS',
        statusCode: integrationsResponse.status,
        shopifyIntegrations: shopifyIntegrations.map((i: any) => ({
          id: i.id,
          name: i.name,
          type: i.type,
        })),
      });
    } catch (error: any) {
      results.tests.push({
        name: 'List Integrations',
        status: 'FAILED',
        statusCode: error.response?.status,
        error: error.response?.data || error.message,
      });
    }

    // Test 3: Try the guidances endpoint with hardcoded IDs
    try {
      console.log('Test 3: Testing guidances endpoint...');
      const guidancesResponse = await axios.get(
        `https://${session.subdomain}.gorgias.com/api/help-center/help-centers/79935/guidances/ai/35564`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      results.tests.push({
        name: 'Get Guidances (with hardcoded IDs)',
        status: 'SUCCESS',
        statusCode: guidancesResponse.status,
        guidancesCount: Array.isArray(guidancesResponse.data) ? guidancesResponse.data.length : 'N/A',
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Get Guidances (with hardcoded IDs)',
        status: 'FAILED',
        statusCode: error.response?.status,
        error: error.response?.data || error.message,
        note: '404 is expected if IDs are wrong, 401/403 means auth issue',
      });
    }

    // Summary
    const successCount = results.tests.filter(t => t.status === 'SUCCESS').length;
    const failCount = results.tests.filter(t => t.status === 'FAILED').length;

    return NextResponse.json({
      summary: {
        total: results.tests.length,
        success: successCount,
        failed: failCount,
        conclusion: successCount > 0 ? 'OAuth token works for some endpoints!' : 'OAuth token has permission issues',
      },
      ...results,
    });
  } catch (error: any) {
    console.error('Test error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

