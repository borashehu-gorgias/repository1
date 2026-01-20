#!/usr/bin/env node
/**
 * Find the Shopify integration ID for Guidances API
 */

import axios from 'axios';
import { loadConfig } from './config';
import { logger } from './logger';

async function findShopifyIntegration() {
  const config = loadConfig();
  logger.setLevel(config.logLevel);

  console.log('🔍 Finding Shopify integration ID...\n');

  const client = axios.create({
    baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
    auth: {
      username: config.gorgiasUsername,
      password: config.gorgiasApiKey,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  try {
    // Get all integrations
    console.log('Fetching all integrations...');
    const response = await client.get('/api/integrations', {
      params: {
        limit: 100,
      },
    });

    const integrations = response.data?.data || [];
    console.log(`✅ Found ${integrations.length} total integrations\n`);

    // Filter for Shopify integrations
    const shopifyIntegrations = integrations.filter((i: any) =>
      i.type === 'shopify' ||
      (i.name && i.name.toLowerCase().includes('shopify'))
    );

    if (shopifyIntegrations.length === 0) {
      console.log('❌ No Shopify integrations found');
      console.log('\nAll integration types:');
      const types = [...new Set(integrations.map((i: any) => i.type))];
      types.forEach(type => console.log(`  - ${type}`));
      return;
    }

    console.log(`📦 Found ${shopifyIntegrations.length} Shopify integration(s):\n`);

    shopifyIntegrations.forEach((integration: any, index: number) => {
      console.log(`${index + 1}. ${integration.name || 'Unnamed'}`);
      console.log(`   ID: ${integration.id}`);
      console.log(`   Type: ${integration.type}`);
      console.log(`   Created: ${integration.created_datetime}`);

      if (integration.description) {
        console.log(`   Description: ${integration.description}`);
      }

      console.log('');
    });

    // Try each Shopify integration with the Guidances API
    console.log('Testing Guidances API with each integration...\n');

    const helpCenterId = config.helpCenterId || 79935;

    for (const integration of shopifyIntegrations) {
      try {
        console.log(`Testing integration ID: ${integration.id}...`);

        const guidancesResponse = await client.get(
          `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${integration.id}`
        );

        console.log(`✅ SUCCESS with integration ID: ${integration.id}`);
        console.log(`   Integration Name: ${integration.name}`);
        console.log(`   Guidances found: ${guidancesResponse.data?.length || 0}\n`);

        if (guidancesResponse.data && guidancesResponse.data.length > 0) {
          console.log('Sample guidance:');
          console.log(JSON.stringify(guidancesResponse.data[0], null, 2));
        }

        console.log('\n✅ Update your .env.local with:');
        console.log(`STORE_INTEGRATION_ID=${integration.id}`);

        return integration.id;

      } catch (error: any) {
        console.log(`  ❌ Failed: ${error.response?.status || error.message}\n`);
      }
    }

    console.log('❌ None of the Shopify integrations worked with the Guidances API');

  } catch (error: any) {
    logger.error('Failed to fetch integrations:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

findShopifyIntegration();
