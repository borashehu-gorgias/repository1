#!/usr/bin/env node
import axios from 'axios';
import { loadConfig } from './config';

async function testUpdateConfig() {
  const config = loadConfig();
  const client = axios.create({
    baseURL: 'https://aiagent.gorgias.help',
    headers: { Authorization: `Bearer ${config.flowsBearerToken}` }
  });

  const account = config.gorgiasSubdomain;
  const store = 'anton-savytski-test-store';

  try {
    // First GET the current config
    console.log('Getting current configuration...');
    const getRes = await client.get(
      `/api/config/accounts/${account}/stores/${store}/configuration`
    );

    console.log('Current config keys:', Object.keys(getRes.data.storeConfiguration || {}));

    // Check if there's a guidances field
    const currentConfig = getRes.data.storeConfiguration;
    console.log('\nSearching for guidances fields...');

    for (const key of Object.keys(currentConfig)) {
      if (key.toLowerCase().includes('guid')) {
        console.log(`  Found: ${key} =`, JSON.stringify(currentConfig[key]).substring(0, 100));
      }
    }

    console.log('\n✅ To update guidances, we likely need to PUT/PATCH to:');
    console.log(`   /api/config/accounts/${account}/stores/${store}/configuration`);
    console.log('   with the full storeConfiguration object including guidances');

  } catch (error: any) {
    console.error('❌ Error:', error.response?.status, error.message);
  }
}

testUpdateConfig();
