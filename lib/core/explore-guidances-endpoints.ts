#!/usr/bin/env node
import axios from 'axios';
import { loadConfig } from './config';

async function explore() {
  const config = loadConfig();
  const client = axios.create({
    baseURL: 'https://aiagent.gorgias.help',
    headers: { Authorization: `Bearer ${config.flowsBearerToken}` }
  });

  const endpoints = [
    '/api/config/accounts/anton-gorgias-demo-store/stores/anton-savytski-test-store/guidances',
    '/api/config/accounts/anton-gorgias-demo-store/guidances',
    '/api/guidances',
    '/api/help-centers/79935/guidances',
  ];

  for (const ep of endpoints) {
    try {
      const res = await client.get(ep);
      console.log('✅', ep);
      console.log('   Type:', Array.isArray(res.data) ? 'Array' : 'Object');
      if (Array.isArray(res.data)) {
        console.log('   Count:', res.data.length);
      } else {
        console.log('   Keys:', Object.keys(res.data));
      }
    } catch (e: any) {
      console.log('❌', ep, e.response?.status || e.message);
    }
  }
}

explore();
