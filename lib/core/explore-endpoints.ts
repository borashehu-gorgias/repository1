#!/usr/bin/env node
/**
 * Explore different possible endpoints for Flows
 */

import axios from 'axios';
import { loadConfig } from './config';

async function exploreEndpoints() {
  console.log('🔍 Exploring possible Flows endpoints...\n');

  try {
    const config = loadConfig();

    const client = axios.create({
      baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
      auth: {
        username: config.gorgiasUsername,
        password: config.gorgiasApiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const endpoints = [
      '/api/flows',
      '/api/automation/flows',
      '/api/internal/flows',
      '/api/workflows',
      '/api/automation/workflows',
      '/api/macros', // Official API
      '/api/rules',  // Official API
      '/api/shopify/flows',
      `/api/shopify/anton-savytski-test-store/flows`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await client.get(endpoint);
        console.log(`  ✅ SUCCESS (${response.status})`);
        console.log(`  Response type: ${typeof response.data}`);

        if (Array.isArray(response.data)) {
          console.log(`  Array with ${response.data.length} items`);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          console.log(`  Object with data array: ${response.data.data.length} items`);
        }

        console.log(`  Sample:`, JSON.stringify(response.data).substring(0, 200));
        console.log('');
      } catch (error: any) {
        const status = error.response?.status || 'Network Error';
        console.log(`  ❌ Failed (${status})`);
        console.log('');
      }
    }

    console.log('\n💡 Recommendation:');
    console.log('Check your browser DevTools Network tab while viewing Flows');
    console.log('Filter by XHR/Fetch to see the actual API calls');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

exploreEndpoints();
