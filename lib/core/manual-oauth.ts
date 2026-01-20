#!/usr/bin/env node
/**
 * Manual OAuth flow - get authorization code from browser, exchange for token
 */

import { loadConfig } from './config';
import { logger } from './logger';
import { GorgiasOAuth } from './oauth';
import axios from 'axios';
import { createInterface } from 'readline';

async function manualOAuth() {
  const config = loadConfig();
  logger.setLevel('debug');

  console.log('🔐 Manual OAuth Flow\n');

  const oauth = new GorgiasOAuth(config);
  const authUrl = oauth.getAuthorizationUrl();

  console.log('Step 1: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');
  console.log('Step 2: After authorizing, you\'ll be redirected to a URL like:');
  console.log('http://localhost:3000/oauth/callback?code=XXXXX&state=XXXXX');
  console.log('\n');
  console.log('Step 3: Copy the CODE from that URL (everything after "code=", before "&state")\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question('Paste the authorization code here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!code) {
    console.log('\n❌ No code provided');
    process.exit(1);
  }

  console.log('\n📊 Exchanging code for access token...');

  try {
    // Exchange code for tokens
    const tokenResponse = await oauth.exchangeCodeForToken(code);

    console.log('\n✅ Tokens obtained successfully!');
    console.log('\nAccess Token (first 50 chars):', tokenResponse.access_token.substring(0, 50) + '...');
    console.log('Refresh Token:', tokenResponse.refresh_token || 'N/A');
    console.log('Expires in:', tokenResponse.expires_in || '24 hours');
    console.log('Scope:', tokenResponse.scope);

    // Test with Flows API
    console.log('\n📊 Testing access token with Flows API...');

    const flowsClient = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const flowsResponse = await flowsClient.get('/configurations', {
      params: { 'is_draft[]': [0, 1] },
    });

    console.log(`✅ Flows API works! Found ${flowsResponse.data.length} flows\n`);

    // Save tokens to .env.local
    if (tokenResponse.refresh_token) {
      console.log('💾 Saving refresh token to .env.local...');

      const fs = await import('fs/promises');
      let envContent = await fs.readFile('.env.local', 'utf-8');

      // Add or update OAUTH_REFRESH_TOKEN
      const refreshTokenRegex = /OAUTH_REFRESH_TOKEN=.*/;
      if (refreshTokenRegex.test(envContent)) {
        envContent = envContent.replace(refreshTokenRegex, `OAUTH_REFRESH_TOKEN=${tokenResponse.refresh_token}`);
      } else {
        envContent += `\nOAUTH_REFRESH_TOKEN=${tokenResponse.refresh_token}\n`;
      }

      // Add or update OAUTH_ACCESS_TOKEN
      const accessTokenRegex = /OAUTH_ACCESS_TOKEN=.*/;
      if (accessTokenRegex.test(envContent)) {
        envContent = envContent.replace(accessTokenRegex, `OAUTH_ACCESS_TOKEN=${tokenResponse.access_token}`);
      } else {
        envContent += `OAUTH_ACCESS_TOKEN=${tokenResponse.access_token}\n`;
      }

      await fs.writeFile('.env.local', envContent);

      console.log('✅ Tokens saved to .env.local');
      console.log('\n🎉 Setup complete! You can now use the migration tool.');
      console.log('\nThe refresh token will be used to automatically renew access tokens.');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

manualOAuth();
