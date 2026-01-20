/**
 * Gorgias OAuth2 Flow Handler
 * Manages OAuth token acquisition for Flows API access
 */

import axios from 'axios';
import { Config, OAuthTokenResponse } from './types';
import { logger } from './logger';
import http from 'http';
import { URL } from 'url';

export class GorgiasOAuth {
  private config: Config;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string, nonce?: string): string {
    // Scopes needed for migration tool:
    // - openid, email, profile: Basic auth info
    // - offline: Get refresh token for long-term access
    // - integrations:read: Read Flows configurations
    // - custom_fields:read/write: Access AI Guidances
    const scopes = [
      'openid',
      'email',
      'profile',
      'offline',
      'integrations:read',
      'integrations:write',
      'custom_fields:read',
      'custom_fields:write',
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.gorgiasClientId,
      scope: scopes.join(' '),
      redirect_uri: this.config.oauthRedirectUri,
      state: state || this.generateRandomString(32),
      nonce: nonce || this.generateRandomString(32),
    });

    return `https://${this.config.gorgiasSubdomain}.gorgias.com/oauth/authorize?${params}`;
  }

  /**
   * Generate random string for state/nonce
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Exchange authorization code for access token
   * Uses Basic Auth with client_id:client_secret
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    logger.info('Exchanging authorization code for access token...');

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: this.config.oauthRedirectUri,
        code,
      });

      const response = await axios.post<OAuthTokenResponse>(
        `https://${this.config.gorgiasSubdomain}.gorgias.com/oauth/token`,
        params.toString(),
        {
          auth: {
            username: this.config.gorgiasClientId,
            password: this.config.gorgiasClientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || null;

      // Gorgias returns expires_in: 0 for 24 hour tokens
      const expiresIn = response.data.expires_in || 86400; // 24 hours default
      this.tokenExpiry = Date.now() + expiresIn * 1000;

      logger.success('✅ OAuth token obtained successfully');
      logger.debug(`Token valid for ${Math.floor(expiresIn / 3600)} hours`);

      return response.data;

    } catch (error: any) {
      logger.error('Failed to exchange authorization code:', error.message);
      if (error.response?.data) {
        logger.error('Response:', JSON.stringify(error.response.data));
      }
      throw new Error(`OAuth token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * Uses Basic Auth with client_id:client_secret
   */
  async refreshAccessToken(): Promise<OAuthTokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    logger.info('Refreshing access token...');

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      });

      const response = await axios.post<OAuthTokenResponse>(
        `https://${this.config.gorgiasSubdomain}.gorgias.com/oauth/token`,
        params.toString(),
        {
          auth: {
            username: this.config.gorgiasClientId,
            password: this.config.gorgiasClientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
      }

      const expiresIn = response.data.expires_in || 86400; // 24 hours default
      this.tokenExpiry = Date.now() + expiresIn * 1000;

      logger.success('✅ Token refreshed successfully');

      return response.data;

    } catch (error: any) {
      logger.error('Failed to refresh token:', error.message);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      logger.debug('Using cached OAuth access token');
      return this.accessToken;
    }

    if (this.refreshToken) {
      await this.refreshAccessToken();
      return this.accessToken!;
    }

    throw new Error('No valid access token. Please authenticate first.');
  }

  /**
   * Start OAuth flow with local callback server
   * Opens browser and waits for authorization
   */
  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authUrl = this.getAuthorizationUrl();
      const redirectUrl = new URL(this.config.oauthRedirectUri);
      const port = parseInt(redirectUrl.port) || 3000;

      const server = http.createServer(async (req, res) => {
        const url = new URL(req.url!, `http://localhost:${port}`);

        if (url.pathname === '/oauth/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>No authorization code received</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          try {
            await this.exchangeCodeForToken(code);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Successful!</h1>
                  <p>You can close this window and return to the terminal.</p>
                </body>
              </html>
            `);

            server.close();
            resolve(this.accessToken!);

          } catch (error: any) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>${error.message}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(error);
          }
        }
      });

      server.listen(port, () => {
        logger.info(`\n🔐 OAuth Authentication Required\n`);
        logger.info(`Please open this URL in your browser:\n`);
        logger.info(`${authUrl}\n`);
        logger.info(`Waiting for authorization...\n`);
      });

      server.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Clear cached tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
}
