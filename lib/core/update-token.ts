#!/usr/bin/env node
/**
 * Interactive script to update Bearer token in .env.local
 */

import fs from 'fs/promises';
import { createInterface } from 'readline';

async function updateToken() {
  console.log('🔐 Update Bearer Token\n');
  console.log('Follow these steps to get a fresh token:\n');
  console.log('1. Open Gorgias in your browser');
  console.log('2. Open DevTools (F12 or Cmd+Option+I)');
  console.log('3. Go to Network tab');
  console.log('4. Filter by "Fetch/XHR"');
  console.log('5. Refresh the page or navigate to Flows');
  console.log('6. Find a request to "api.gorgias.work" or "aiagent.gorgias.help"');
  console.log('7. Click on it → Headers tab → Request Headers');
  console.log('8. Copy the value after "authorization: Bearer "\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const token = await new Promise<string>((resolve) => {
    rl.question('Paste the Bearer token here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.log('\n❌ No token provided');
    process.exit(1);
  }

  // Validate JWT format
  if (!token.match(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
    console.log('\n❌ Invalid JWT format');
    console.log('Token should start with "eyJ" and have 3 parts separated by dots');
    process.exit(1);
  }

  // Decode and check expiration
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const now = Math.floor(Date.now() / 1000);

    console.log('\n✅ Valid JWT token');
    console.log(`User ID: ${payload.user_id}`);
    console.log(`Account ID: ${payload.account_id}`);
    console.log(`Roles: ${payload.roles?.join(', ')}`);

    if (payload.exp) {
      const expiresAt = new Date(payload.exp * 1000);
      console.log(`Expires: ${expiresAt.toISOString()}`);

      if (payload.exp < now) {
        console.log('⚠️  WARNING: Token already expired!');
      } else {
        const hoursUntilExpiry = Math.floor((payload.exp - now) / 3600);
        console.log(`⏰ Valid for: ${hoursUntilExpiry} hours`);
      }
    }

    // Update .env.local
    const envPath = '.env.local';
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Replace token
    const tokenRegex = /FLOWS_BEARER_TOKEN=.*/;
    if (tokenRegex.test(envContent)) {
      envContent = envContent.replace(tokenRegex, `FLOWS_BEARER_TOKEN=${token}`);
    } else {
      envContent += `\nFLOWS_BEARER_TOKEN=${token}\n`;
    }

    await fs.writeFile(envPath, envContent);

    console.log('\n✅ Token updated in .env.local');
    console.log('\nYou can now run:');
    console.log('  npm run fetch-flows');
    console.log('  npm run test-guidances');

  } catch (error: any) {
    console.log('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateToken();
