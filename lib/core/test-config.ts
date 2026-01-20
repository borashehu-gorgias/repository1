#!/usr/bin/env node
/**
 * Configuration test script
 * Tests your .env.local setup and API connectivity
 */

import { loadConfig } from './config';
import { logger } from './logger';
import { GorgiasApiClient } from './api-client';

async function testConfiguration() {
  console.log('🔍 Testing Gorgias Flows Migrator Configuration\n');

  try {
    // Step 1: Load config
    console.log('1️⃣  Loading configuration...');
    const config = loadConfig();
    logger.setLevel('debug');
    console.log('✅ Configuration loaded successfully\n');

    // Step 2: Display config (masked)
    console.log('📋 Configuration:');
    console.log(`   Subdomain: ${config.gorgiasSubdomain}`);
    console.log(`   Username: ${config.gorgiasUsername}`);
    console.log(`   API Key: ${config.gorgiasApiKey.substring(0, 10)}...`);
    console.log(`   Help Center ID: ${config.helpCenterId}`);
    console.log(`   Store Integration ID: ${config.storeIntegrationId}`);
    console.log(`   Log Level: ${config.logLevel}`);
    console.log(`   Dry Run: ${config.dryRun}\n`);

    // Step 3: Test API connectivity
    console.log('2️⃣  Testing API connectivity...');
    const client = new GorgiasApiClient(config);

    try {
      console.log('   Testing Flows API...');
      const flows = await client.getFlows();
      console.log(`   ✅ Flows API: ${flows.length} flows found\n`);
    } catch (error: any) {
      console.log(`   ❌ Flows API Error: ${error.message}\n`);
    }

    try {
      console.log('   Testing Guidances API...');
      const guidances = await client.getGuidances();
      console.log(`   ✅ Guidances API: ${guidances.length} guidances found\n`);
    } catch (error: any) {
      console.log(`   ❌ Guidances API Error: ${error.message}\n`);
    }

    console.log('✅ Configuration test complete!\n');

  } catch (error: any) {
    console.error('\n❌ Configuration Error:', error.message);
    console.error('\nPlease check your .env.local file and ensure all required values are set.\n');
    process.exit(1);
  }
}

testConfiguration();
