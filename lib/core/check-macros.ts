#!/usr/bin/env node
import axios from 'axios';
import { loadConfig } from './config';

async function checkMacros() {
  const config = loadConfig();

  const client = axios.create({
    baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
    auth: {
      username: config.gorgiasUsername,
      password: config.gorgiasApiKey,
    },
  });

  console.log('📋 Fetching Macros...\n');
  const response = await client.get('/api/macros');

  const macros = response.data?.data || [];

  console.log(`Found ${macros.length} macros:\n`);

  macros.slice(0, 3).forEach((macro: any, i: number) => {
    console.log(`${i + 1}. ${macro.name || 'Unnamed'}`);
    console.log(`   ID: ${macro.id}`);
    console.log(`   Actions: ${macro.actions?.length || 0}`);
    console.log(`   Sample:`, JSON.stringify(macro).substring(0, 200));
    console.log('');
  });
}

checkMacros();
