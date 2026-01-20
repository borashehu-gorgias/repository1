#!/usr/bin/env node
/**
 * Fetch and display flows from api.gorgias.work
 */

import axios from 'axios';
import { loadConfig } from './config';
import { logger } from './logger';
import fs from 'fs/promises';

async function fetchFlows() {
  try {
    const config = loadConfig();
    logger.setLevel(config.logLevel);

    logger.info('Fetching flows from api.gorgias.work...\n');

    const client = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${config.flowsBearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    const response = await client.get('/configurations', {
      params: {
        'is_draft[]': [0, 1], // Get both draft and non-draft
      },
    });

    const flows = response.data || [];

    logger.success(`Found ${flows.length} flows`);

    // Show summary
    console.log('\n📊 Flows Summary:\n');
    flows.slice(0, 10).forEach((flow: any, i: number) => {
      console.log(`${i + 1}. ${flow.name || 'Unnamed'}`);
      console.log(`   ID: ${flow.id}`);
      console.log(`   Draft: ${flow.is_draft}`);
      console.log(`   Steps: ${flow.steps?.length || 0}`);
      console.log('');
    });

    if (flows.length > 10) {
      console.log(`... and ${flows.length - 10} more\n`);
    }

    // Save to file
    const outputFile = 'flows-export.json';
    await fs.writeFile(outputFile, JSON.stringify(flows, null, 2));
    logger.success(`Saved all flows to ${outputFile}`);

    logger.info('\n✅ Next steps:');
    logger.info('1. Review flows-export.json');
    logger.info('2. Check the structure to understand how to convert to Guidances');
    logger.info('3. Run the migration tool once ready');

  } catch (error: any) {
    logger.error('Failed to fetch flows:', error.message);
    if (error.response?.status === 401) {
      logger.error('\n❌ Token expired or invalid');
      logger.error('Get a new token from browser DevTools and update FLOWS_BEARER_TOKEN in .env.local');
    }
    process.exit(1);
  }
}

fetchFlows();
