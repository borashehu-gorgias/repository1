#!/usr/bin/env node
/**
 * Test if Gorgias supports client_credentials grant (machine-to-machine)
 */

import { loadConfig } from './config';
import { logger } from './logger';
import axios from 'axios';

async function testClientCredentials() {
  const config = loadConfig();
  logger.setLevel('debug');

  console.log('🔐 Testing Client Credentials Grant (Machine-to-Machine)\n');

  // Test client_credentials grant type
  try {
    console.log('Attempting client_credentials grant...\n');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'openid email profile integrations:read integrations:write custom_fields:read custom_fields:write',
    });

    const response = await axios.post(
      `https://${config.gorgiasSubdomain}.gorgias.com/oauth/token`,
      params.toString(),
      {
        auth: {
          username: config.gorgiasClientId,
          password: config.gorgiasClientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ SUCCESS! Client credentials grant works!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    const token = response.data.access_token;

    // Test with Flows API
    console.log('\n📊 Testing token with Flows API...');

    const flowsClient = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const flowsResponse = await flowsClient.get('/configurations', {
      params: { 'is_draft[]': [0, 1] },
    });

    console.log(`✅ Flows API works! Found ${flowsResponse.data.length} flows\n`);

    console.log('🎉 Fully automatic OAuth without browser!\n');
    console.log('This means we can generate tokens programmatically using client credentials.');

  } catch (error: any) {
    console.log('❌ Client credentials grant not supported\n');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    console.log('\nThis means:');
    console.log('1. Gorgias requires user authorization (browser flow)');
    console.log('2. We need the one-time manual authorization step');
    console.log('3. After that, we can use refresh_token for automatic renewal');
    console.log('\nThe manual step is required by OAuth 2.0 security design.');
  }
}

testClientCredentials();
