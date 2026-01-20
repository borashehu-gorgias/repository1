#!/usr/bin/env node
/**
 * Try to get a Bearer token for api.gorgias.work using API credentials
 */

import axios from 'axios';
import { loadConfig } from './config';

async function getBearerToken() {
  console.log('🔍 Attempting to get Bearer token...\n');

  const config = loadConfig();

  // Try different auth endpoints
  const authEndpoints = [
    '/api/auth/token',
    '/api/auth/integrate',
    '/api/auth',
    '/gorgias-apps/auth',
    '/api/oauth/token',
  ];

  const client = axios.create({
    baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
    auth: {
      username: config.gorgiasUsername,
      password: config.gorgiasApiKey,
    },
  });

  for (const endpoint of authEndpoints) {
    try {
      console.log(`Trying ${endpoint}...`);
      const response = await client.post(endpoint);
      console.log('✅ Success!');
      console.log(JSON.stringify(response.data, null, 2));
      return;
    } catch (error: any) {
      console.log(`  ❌ ${error.response?.status || error.message}`);
    }
  }

  console.log('\n❌ Could not find token endpoint');
  console.log('\n💡 Options:');
  console.log('1. Extract token from browser session (temporary)');
  console.log('2. Contact Gorgias support for API access to api.gorgias.work');
  console.log('3. Use browser automation to get token programmatically');
}

getBearerToken();
