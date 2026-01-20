import dotenv from 'dotenv';
import { Config } from './types';

// Load environment variables
dotenv.config({ path: '.env.local' });

export function loadConfig(): Config {
  const requiredEnvVars = [
    'GORGIAS_SUBDOMAIN',
    'GORGIAS_API_KEY',
    'GORGIAS_USERNAME',
    'GORGIAS_CLIENT_ID',
    'GORGIAS_CLIENT_SECRET',
    'OAUTH_REDIRECT_URI',
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }

  const helpCenterId = process.env.HELP_CENTER_ID
    ? parseInt(process.env.HELP_CENTER_ID, 10)
    : undefined;

  const storeIntegrationId = process.env.STORE_INTEGRATION_ID
    ? parseInt(process.env.STORE_INTEGRATION_ID, 10)
    : undefined;

  return {
    gorgiasSubdomain: process.env.GORGIAS_SUBDOMAIN!,
    gorgiasApiKey: process.env.GORGIAS_API_KEY!,
    gorgiasUsername: process.env.GORGIAS_USERNAME!,
    gorgiasClientId: process.env.GORGIAS_CLIENT_ID!,
    gorgiasClientSecret: process.env.GORGIAS_CLIENT_SECRET!,
    oauthRedirectUri: process.env.OAUTH_REDIRECT_URI!,
    helpCenterId,
    storeIntegrationId,
    logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
    dryRun: process.env.DRY_RUN === 'true',
  };
}
