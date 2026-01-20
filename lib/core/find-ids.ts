#!/usr/bin/env node
/**
 * Helper script to find Help Center ID and Store Integration ID
 */

import axios from 'axios';
import { loadConfig } from './config';

async function findIds() {
  console.log('🔍 Searching for Help Center and Store Integration IDs...\n');

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
    });

    // Try to find Help Center
    console.log('1️⃣  Looking for Help Centers...');
    try {
      const response = await client.get('/api/help-center/help-centers');
      console.log('✅ Found Help Centers:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('❌ Error fetching help centers:', error.response?.status || error.message);
    }

    console.log('\n2️⃣  Looking for Integrations...');
    try {
      const response = await client.get('/api/integrations');
      console.log('✅ Found Integrations:');
      const integrations = response.data?.data || response.data || [];

      integrations.forEach((integration: any, index: number) => {
        console.log(`\n  Integration ${index + 1}:`);
        console.log(`    ID: ${integration.id}`);
        console.log(`    Name: ${integration.name || 'N/A'}`);
        console.log(`    Type: ${integration.type || 'N/A'}`);
      });

      // Look for store integrations specifically
      const storeIntegrations = integrations.filter((i: any) =>
        i.type?.includes('shopify') ||
        i.type?.includes('store') ||
        i.name?.toLowerCase().includes('store') ||
        i.name?.toLowerCase().includes('shopify')
      );

      if (storeIntegrations.length > 0) {
        console.log('\n📦 Store Integration(s) found:');
        storeIntegrations.forEach((integration: any) => {
          console.log(`  ID: ${integration.id} - ${integration.name || integration.type}`);
        });
      }

    } catch (error: any) {
      console.log('❌ Error fetching integrations:', error.response?.status || error.message);
    }

    // Try to check account info
    console.log('\n3️⃣  Checking Account Info...');
    try {
      const response = await client.get('/api/account');
      console.log('✅ Account Info:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('❌ Error fetching account:', error.response?.status || error.message);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

findIds();
