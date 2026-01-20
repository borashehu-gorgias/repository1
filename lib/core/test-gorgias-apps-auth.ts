#!/usr/bin/env node
/**
 * Test /gorgias-apps/auth endpoint for getting OAuth token
 */

import { loadConfig } from './config';
import { logger } from './logger';
import axios from 'axios';

async function testGorgiasAppsAuth() {
  const config = loadConfig();
  logger.setLevel('debug');

  console.log('🔐 Testing /gorgias-apps/auth endpoint\n');

  // Try different methods to get token from /gorgias-apps/auth
  const methods = [
    {
      name: 'POST with Basic Auth (client credentials)',
      request: async () => {
        return await axios.post(
          `https://${config.gorgiasSubdomain}.gorgias.com/gorgias-apps/auth`,
          {},
          {
            auth: {
              username: config.gorgiasClientId,
              password: config.gorgiasClientSecret,
            },
          }
        );
      },
    },
    {
      name: 'POST with Basic Auth (user credentials)',
      request: async () => {
        return await axios.post(
          `https://${config.gorgiasSubdomain}.gorgias.com/gorgias-apps/auth`,
          {},
          {
            auth: {
              username: config.gorgiasUsername,
              password: config.gorgiasApiKey,
            },
          }
        );
      },
    },
    {
      name: 'POST with client credentials in body',
      request: async () => {
        return await axios.post(
          `https://${config.gorgiasSubdomain}.gorgias.com/gorgias-apps/auth`,
          {
            client_id: config.gorgiasClientId,
            client_secret: config.gorgiasClientSecret,
          }
        );
      },
    },
    {
      name: 'POST with grant_type client_credentials',
      request: async () => {
        const params = new URLSearchParams({
          grant_type: 'client_credentials',
        });

        return await axios.post(
          `https://${config.gorgiasSubdomain}.gorgias.com/gorgias-apps/auth`,
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
      },
    },
    {
      name: 'GET with Basic Auth (client credentials)',
      request: async () => {
        return await axios.get(
          `https://${config.gorgiasSubdomain}.gorgias.com/gorgias-apps/auth`,
          {
            auth: {
              username: config.gorgiasClientId,
              password: config.gorgiasClientSecret,
            },
          }
        );
      },
    },
  ];

  for (const method of methods) {
    try {
      console.log(`Trying: ${method.name}...`);
      const response = await method.request();

      console.log('✅ SUCCESS!\n');
      console.log('Response:', JSON.stringify(response.data, null, 2));

      // Check if we got a token
      if (response.data?.token || response.data?.access_token || response.data?.jwt) {
        const token = response.data.token || response.data.access_token || response.data.jwt;
        console.log('\n🎉 Got token!');
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

        // Decode and show info
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          console.log('Token payload:', JSON.stringify(payload, null, 2));
          if (payload.exp) {
            console.log('Expires:', new Date(payload.exp * 1000).toISOString());
          }
        } catch (e) {
          // Not a JWT
        }

        // Test with Flows API
        console.log('\n📊 Testing token with Flows API...');
        const flowsClient = axios.create({
          baseURL: 'https://api.gorgias.work',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        try {
          const flowsResponse = await flowsClient.get('/configurations', {
            params: { 'is_draft[]': [0, 1] },
          });
          console.log(`✅ Flows API works! Found ${flowsResponse.data.length} flows`);
        } catch (error: any) {
          console.log(`❌ Flows API failed: ${error.response?.status} ${error.message}`);
        }

        return;
      }

      return;

    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.msg || error.response?.data?.detail || error.message;
      console.log(`  ❌ ${status || 'Error'}: ${message}\n`);
    }
  }

  console.log('❌ Could not get token from /gorgias-apps/auth with any method\n');
  console.log('💡 Will need to use full OAuth flow with correct redirect URI');
}

testGorgiasAppsAuth();
