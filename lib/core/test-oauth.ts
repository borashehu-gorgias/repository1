#!/usr/bin/env node
/**
 * Test OAuth flow and dual-token authentication
 */

import { loadConfig } from './config';
import { logger } from './logger';
import { GorgiasOAuth } from './oauth';
import { GorgiasAuth } from './auth';
import axios from 'axios';

async function testOAuth() {
  const config = loadConfig();
  logger.setLevel('debug');

  console.log('🔐 Testing OAuth Flow & Dual-Token Authentication\n');

  try {
    // Step 1: OAuth flow for Flows API
    console.log('📊 Step 1: Getting OAuth token for Flows API...\n');

    const oauth = new GorgiasOAuth(config);
    const oauthToken = await oauth.authenticate();

    console.log('✅ OAuth token obtained!');
    console.log('Token (first 50 chars):', oauthToken.substring(0, 50) + '...');
    console.log('Expired:', oauth.isTokenExpired());

    // Test with Flows API
    console.log('\n📊 Testing OAuth token with Flows API...');

    const flowsClient = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
    });

    const flowsResponse = await flowsClient.get('/configurations', {
      params: { 'is_draft[]': [0, 1] },
    });

    console.log(`✅ Flows API works! Found ${flowsResponse.data.length} flows\n`);

    // Step 2: Help Center token for Guidances API
    console.log('📋 Step 2: Getting Help Center token for Guidances API...\n');

    const auth = new GorgiasAuth(config);
    const helpCenterToken = await auth.getBearerToken();

    console.log('✅ Help Center token obtained!');
    console.log('Token (first 50 chars):', helpCenterToken.substring(0, 50) + '...');
    console.log('Expired:', auth.isTokenExpired());

    // Test with Guidances API
    console.log('\n📋 Testing Help Center token with Guidances API...');

    const guidancesClient = axios.create({
      baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
      headers: {
        'Authorization': `Bearer ${helpCenterToken}`,
        'Content-Type': 'application/json',
      },
    });

    const helpCenterId = config.helpCenterId || 79935;
    const storeIntegrationId = 35564; // anton-savytski-test-store

    const guidancesResponse = await guidancesClient.get(
      `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`
    );

    const guidanceCount = Array.isArray(guidancesResponse.data)
      ? guidancesResponse.data.length
      : 0;

    console.log(`✅ Guidances API works! Found ${guidanceCount} guidances\n`);

    if (guidanceCount > 0) {
      console.log('First guidance:');
      console.log(JSON.stringify(guidancesResponse.data[0], null, 2));
    }

    // Success summary
    console.log('\n🎉 Dual-Token Authentication Working!\n');
    console.log('Summary:');
    console.log(`  • OAuth Token (Flows API): Valid for ${flowsResponse.data.length} flows`);
    console.log(`  • Help Center Token (Guidances API): Valid for ${guidanceCount} guidances`);
    console.log('\n✅ Ready for migration!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

testOAuth();
