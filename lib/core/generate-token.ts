#!/usr/bin/env node
/**
 * Generate Bearer token automatically from API credentials
 */

import axios from 'axios';
import { loadConfig } from './config';
import { logger } from './logger';

async function generateToken() {
  const config = loadConfig();
  logger.setLevel(config.logLevel);

  console.log('🔐 Generating Bearer token...\n');

  // Try different authentication methods for /gorgias-apps/auth
  const methods = [
    {
      name: 'POST with Basic Auth (no body)',
      request: async () => {
        const client = axios.create({
          baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
          auth: {
            username: config.gorgiasUsername,
            password: config.gorgiasApiKey,
          },
        });
        return await client.post('/gorgias-apps/auth');
      },
    },
    {
      name: 'POST with credentials in body',
      request: async () => {
        const client = axios.create({
          baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
        });
        return await client.post('/gorgias-apps/auth', {
          username: config.gorgiasUsername,
          api_key: config.gorgiasApiKey,
        });
      },
    },
    {
      name: 'POST with email/password format',
      request: async () => {
        const client = axios.create({
          baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
        });
        return await client.post('/gorgias-apps/auth', {
          email: config.gorgiasUsername,
          password: config.gorgiasApiKey,
        });
      },
    },
    {
      name: 'GET with Basic Auth',
      request: async () => {
        const client = axios.create({
          baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
          auth: {
            username: config.gorgiasUsername,
            password: config.gorgiasApiKey,
          },
        });
        return await client.get('/gorgias-apps/auth');
      },
    },
    {
      name: 'POST to /api/auth/token',
      request: async () => {
        const client = axios.create({
          baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
          auth: {
            username: config.gorgiasUsername,
            password: config.gorgiasApiKey,
          },
        });
        return await client.post('/api/auth/token');
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
        console.log('\n🎉 Got Bearer token!');
        console.log('Token:', token.substring(0, 50) + '...');

        // Decode and show expiration
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          if (payload.exp) {
            console.log('Expires:', new Date(payload.exp * 1000).toISOString());
          }
        } catch (e) {
          // Token not JWT format
        }

        console.log('\n✅ Update your .env.local with:');
        console.log(`FLOWS_BEARER_TOKEN=${token}`);
        return token;
      }

      return;

    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.msg || error.message;
      console.log(`  ❌ ${status || 'Error'}: ${message}\n`);
    }
  }

  console.log('❌ Could not generate token with any method\n');
  console.log('💡 The token might need to be obtained through:');
  console.log('1. Browser session cookies');
  console.log('2. OAuth flow');
  console.log('3. Different API endpoint');
  console.log('\nFor now, manually copy token from browser DevTools.');
}

generateToken();
