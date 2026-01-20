#!/usr/bin/env node
/**
 * Test the official Guidances API endpoint
 */

import axios from 'axios';
import { loadConfig } from './config';
import { logger } from './logger';

async function testGuidancesAPI() {
  const config = loadConfig();
  logger.setLevel('debug');

  console.log('🔍 Testing Guidances API...\n');

  const client = axios.create({
    baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
    auth: {
      username: config.gorgiasUsername,
      password: config.gorgiasApiKey,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const helpCenterId = config.helpCenterId || 79935;

  // We need to find the store_integration_id
  // Let's try a few possibilities
  const storeIds = [
    'anton-savytski-test-store', // store name
    '0', // might be 0 for default
    '1', // might be 1
    config.storeIntegrationId, // if we have it
  ];

  console.log(`Help Center ID: ${helpCenterId}\n`);

  for (const storeId of storeIds) {
    if (!storeId) continue;

    try {
      console.log(`Trying store_integration_id: ${storeId}...`);

      const response = await client.get(
        `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeId}`
      );

      console.log(`✅ SUCCESS with store_integration_id: ${storeId}\n`);
      console.log('Response type:', Array.isArray(response.data) ? 'Array' : 'Object');

      if (Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} guidances`);

        if (response.data.length > 0) {
          console.log('\nFirst guidance:');
          console.log(JSON.stringify(response.data[0], null, 2));
        }
      } else {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }

      console.log('\n✅ Found the correct endpoint!');
      console.log(`Store Integration ID: ${storeId}`);
      return;

    } catch (error: any) {
      console.log(`  ❌ ${error.response?.status || error.message}\n`);
    }
  }

  console.log('❌ Could not find correct store_integration_id');
  console.log('\n💡 Try getting it from the Integrations API:');
  console.log('   GET /api/integrations');
}

testGuidancesAPI();
