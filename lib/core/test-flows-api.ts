#!/usr/bin/env node
/**
 * Test the actual Flows API at api.gorgias.work
 */

import axios from 'axios';
import { loadConfig } from './config';

async function testFlowsApi() {
  console.log('🔍 Testing Flows API at api.gorgias.work...\n');

  try {
    const config = loadConfig();

    // We need to get an auth token first
    // The authorization header from browser will tell us the format

    const client = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('Attempting to fetch configurations...');
    console.log('Note: We need the authorization token from your browser.\n');

    try {
      // Try without auth first to see the error
      const response = await client.get('/configurations', {
        params: {
          'is_draft[]': [0, 1],
        },
      });

      console.log('✅ Success! Response:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('❌ 401 Unauthorized - Need auth token\n');
        console.log('📝 Next steps:');
        console.log('1. In your browser Network tab, find the GET request to:');
        console.log('   https://api.gorgias.work/configurations');
        console.log('2. Copy the "authorization" header value');
        console.log('3. Share it here so we can test\n');
      } else {
        console.log(`❌ Error: ${error.response?.status || error.message}`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testFlowsApi();
