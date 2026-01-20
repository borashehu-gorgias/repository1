#!/usr/bin/env node
/**
 * Test the AI Agent configuration API
 */

import axios from 'axios';
import { loadConfig } from './config';

async function testAIAgentAPI() {
  const config = loadConfig();

  console.log('🔍 Testing AI Agent API...\n');

  const client = axios.create({
    baseURL: 'https://aiagent.gorgias.help',
    headers: {
      'Authorization': `Bearer ${config.flowsBearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  const account = config.gorgiasSubdomain;
  const store = 'anton-savytski-test-store'; // TODO: make this configurable

  try {
    // Get configuration
    console.log('GET configuration...');
    const getRes = await client.get(
      `/api/config/accounts/${account}/stores/${store}/configuration`,
      { params: { with_wizard: false } }
    );

    console.log('✅ GET Success!');
    console.log('Response keys:', Object.keys(getRes.data));
    console.log('\nSample:');
    console.log(JSON.stringify(getRes.data, null, 2).substring(0, 800));

    // Check if guidances field exists
    if (getRes.data.guidances) {
      console.log(`\n\n📋 Found ${getRes.data.guidances.length || 0} guidances`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testAIAgentAPI();
