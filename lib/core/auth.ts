/**
 * Gorgias Authentication - Auto-generates and caches Bearer tokens
 */

import axios from 'axios';
import { Config } from './types';
import { logger } from './logger';

export class GorgiasAuth {
  private config: Config;
  private bearerToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Gets a temporary bearer token from Gorgias API.
   * Uses Basic Auth (username:apiKey) to exchange for a bearer token.
   * Caches the token until it expires (default 1 hour).
   */
  async getBearerToken(): Promise<string> {
    // Check if we have a valid token that hasn't expired
    if (this.bearerToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      logger.debug('Using cached bearer token');
      return this.bearerToken;
    }

    logger.info('Generating new bearer token...');

    try {
      const response = await axios.post(
        `https://${this.config.gorgiasSubdomain}.gorgias.com/api/help-center/auth`,
        {},
        {
          auth: {
            username: this.config.gorgiasUsername,
            password: this.config.gorgiasApiKey,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.bearerToken = response.data.access_token;

      if (!this.bearerToken) {
        throw new Error('No access_token returned from Gorgias API');
      }

      // Set token expiry (assume 1 hour if not provided)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + expiresIn * 1000;

      // Decode token to show info
      try {
        const payload = JSON.parse(
          Buffer.from(this.bearerToken.split('.')[1], 'base64').toString()
        );
        logger.debug(`Token valid for ${Math.floor(expiresIn / 60)} minutes`);
        logger.debug(`User: ${payload.user_id}, Account: ${payload.account_id}`);
      } catch (e) {
        // Not a JWT, that's OK
      }

      logger.success('✅ Bearer token generated successfully');
      return this.bearerToken;

    } catch (error: any) {
      logger.error('Failed to get bearer token:', error.message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          'Authentication failed. Check your GORGIAS_USERNAME and GORGIAS_API_KEY in .env.local'
        );
      }

      throw new Error(`Failed to generate bearer token: ${error.message}`);
    }
  }

  /**
   * Clears cached token, forcing a refresh on next call
   */
  clearToken(): void {
    this.bearerToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Checks if current token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }
}
