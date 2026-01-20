#!/usr/bin/env node
/**
 * Test automatic bearer token generation
 */

import { loadConfig } from './config';
import { logger } from './logger';
import { GorgiasAuth } from './auth';
import axios from 'axios';

async function testAutoAuth() {
  const config = loadConfig();
  logger.setLevel('debug');

  console.log('🔐 Testing automatic bearer token generation...\n');

  try {
    // Create auth instance
    const auth = new GorgiasAuth(config);

    // Get bearer token automatically
    const token = await auth.getBearerToken();

    console.log('\n✅ Token generated!');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('Expired:', auth.isTokenExpired());

    // Test using the token with Flows API
    console.log('\n📊 Testing token with Flows API...');

    const flowsClient = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const flowsResponse = await flowsClient.get('/configurations', {
      params: { 'is_draft[]': [0, 1] },
    });

    console.log(`✅ Flows API works! Found ${flowsResponse.data.length} flows`);

    // Test using the token with Guidances API
    console.log('\n📋 Testing token with Guidances API...');

    const guidancesClient = axios.create({
      baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const helpCenterId = config.helpCenterId || 79935;
    const storeIntegrationId = 35564; // anton-savytski-test-store

    const guidancesResponse = await guidancesClient.get(
      `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`
    );

    console.log(`✅ Guidances API works! Found ${guidancesResponse.data.length || 0} guidances`);

    if (guidancesResponse.data.length > 0) {
      console.log('\nFirst guidance:');
      console.log(JSON.stringify(guidancesResponse.data[0], null, 2));
    }

    console.log('\n🎉 All APIs working with auto-generated token!');
    console.log('\n✅ You can now use this for the migration tool');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testAutoAuth();
