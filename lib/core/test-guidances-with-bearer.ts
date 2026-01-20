#!/usr/bin/env node
/**
 * Test Guidances API with Bearer token instead of Basic Auth
 */

import axios from 'axios';
import { loadConfig } from './config';
import { logger } from './logger';

async function testGuidancesWithBearer() {
  const config = loadConfig();
  logger.setLevel(config.logLevel);

  console.log('🔍 Testing Guidances API with Bearer token...\n');

  const client = axios.create({
    baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
    headers: {
      'Authorization': `Bearer ${config.flowsBearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  const helpCenterId = 79935;
  const storeIntegrationId = 35564; // anton-savytski-test-store

  try {
    console.log(`Trying with Bearer token...`);
    console.log(`Help Center ID: ${helpCenterId}`);
    console.log(`Store Integration ID: ${storeIntegrationId}\n`);

    const response = await client.get(
      `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`
    );

    console.log('✅ SUCCESS with Bearer token!\n');
    console.log('Response type:', Array.isArray(response.data) ? 'Array' : 'Object');

    if (Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} guidances\n`);

      if (response.data.length > 0) {
        console.log('First guidance:');
        console.log(JSON.stringify(response.data[0], null, 2));
        console.log('\n...');
      } else {
        console.log('No guidances exist yet - ready to create some!');
      }
    } else {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

    console.log('\n✅ Guidances API endpoint confirmed!');
    console.log(`   Endpoint: GET /api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`);
    console.log(`   Auth: Bearer token (not Basic Auth)`);

    // Update .env.local
    console.log('\n📝 Update your .env.local with:');
    console.log(`STORE_INTEGRATION_ID=${storeIntegrationId}`);

  } catch (error: any) {
    console.log(`❌ Failed: ${error.response?.status || error.message}`);

    if (error.response?.status === 403) {
      console.log('\n403 Forbidden - This could mean:');
      console.log('1. Wrong store_integration_id');
      console.log('2. Bearer token lacks required permissions');
      console.log('3. Guidances feature not enabled for this account');
    }

    if (error.response?.data) {
      console.log('\nResponse:', error.response.data);
    }
  }
}

testGuidancesWithBearer();
