import axios, { AxiosInstance } from 'axios';
import { Config } from './types';
import { logger } from './logger';

export class GorgiasApiClient {
  private client: AxiosInstance;
  private config: Config;

  constructor(config: Config) {
    this.config = config;

    // Create base axios instance for Gorgias API
    this.client = axios.create({
      baseURL: `https://${config.gorgiasSubdomain}.gorgias.com`,
      auth: {
        username: config.gorgiasUsername,
        password: config.gorgiasApiKey,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error(
            `API Error: ${error.response.status} ${error.config?.url}`,
            error.response.data
          );
        } else {
          logger.error('API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all Flows from Gorgias
   * GET /api/flows
   */
  async getFlows(): Promise<any[]> {
    try {
      logger.info('Fetching Flows from Gorgias...');
      const response = await this.client.get('/api/flows');

      // Handle different response structures
      const flows = response.data?.data || response.data || [];
      logger.success(`Retrieved ${flows.length} flows`);

      return flows;
    } catch (error: any) {
      logger.error('Failed to fetch flows:', error.message);
      throw new Error(`Failed to fetch flows: ${error.message}`);
    }
  }

  /**
   * Fetch a specific Flow by ID
   * GET /api/flows/{flow_id}
   */
  async getFlow(flowId: string | number): Promise<any> {
    try {
      logger.info(`Fetching Flow ${flowId}...`);
      const response = await this.client.get(`/api/flows/${flowId}`);

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch flow ${flowId}:`, error.message);
      throw new Error(`Failed to fetch flow ${flowId}: ${error.message}`);
    }
  }

  /**
   * Fetch existing AI Guidances
   * GET /api/help-center/help-centers/{help_center_id}/guidances/ai/{store_integration_id}
   */
  async getGuidances(): Promise<any[]> {
    try {
      const { helpCenterId, storeIntegrationId } = this.config;
      logger.info('Fetching existing AI Guidances...');

      const response = await this.client.get(
        `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`
      );

      const guidances = response.data || [];
      logger.success(`Retrieved ${guidances.length} existing guidances`);

      return guidances;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn('No existing guidances found (404)');
        return [];
      }
      logger.error('Failed to fetch guidances:', error.message);
      throw new Error(`Failed to fetch guidances: ${error.message}`);
    }
  }

  /**
   * Create or update AI Guidances
   * Based on the API structure, this appears to be a POST or PUT request
   * We'll try POST first as it's common for batch creates
   */
  async createGuidances(guidances: any[]): Promise<any> {
    try {
      const { helpCenterId, storeIntegrationId } = this.config;

      if (this.config.dryRun) {
        logger.warn('[DRY RUN] Would create guidances:', guidances);
        return { dry_run: true, guidances };
      }

      logger.info(`Creating ${guidances.length} AI Guidances...`);

      // Try POST endpoint first
      const response = await this.client.post(
        `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`,
        guidances
      );

      logger.success(`Successfully created ${guidances.length} guidances`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create guidances:', error.message);
      throw new Error(`Failed to create guidances: ${error.message}`);
    }
  }

  /**
   * Update AI Guidances (alternative endpoint if POST doesn't work)
   */
  async updateGuidances(guidances: any[]): Promise<any> {
    try {
      const { helpCenterId, storeIntegrationId } = this.config;

      if (this.config.dryRun) {
        logger.warn('[DRY RUN] Would update guidances:', guidances);
        return { dry_run: true, guidances };
      }

      logger.info(`Updating ${guidances.length} AI Guidances...`);

      const response = await this.client.put(
        `/api/help-center/help-centers/${helpCenterId}/guidances/ai/${storeIntegrationId}`,
        guidances
      );

      logger.success(`Successfully updated ${guidances.length} guidances`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to update guidances:', error.message);
      throw new Error(`Failed to update guidances: ${error.message}`);
    }
  }

  /**
   * Fetch tickets with specific tag
   * GET /api/tickets and filter by tag
   */
  async getTicketsWithTag(tagName: string, limit: number = 10): Promise<any> {
    try {
      logger.info(`Fetching tickets with tag: ${tagName}...`);

      // Fetch recent tickets (we'll need to fetch more than limit to find enough with the tag)
      const fetchLimit = Math.max(limit * 5, 50); // Fetch 5x more to account for filtering
      const response = await this.client.get('/api/tickets', {
        params: {
          limit: fetchLimit,
          order_by: 'updated_datetime:desc'
        }
      });

      const allTickets = response.data?.data || response.data || [];

      // Filter tickets that have the specified tag
      const filteredTickets = allTickets.filter((ticket: any) => {
        const ticketTags = ticket.tags || [];
        return ticketTags.some((tag: any) =>
          tag.name?.toLowerCase() === tagName.toLowerCase()
        );
      });

      // Limit to requested number
      const tickets = filteredTickets.slice(0, limit);

      logger.success(`Retrieved ${tickets.length} tickets with tag "${tagName}" (from ${allTickets.length} total tickets)`);

      return tickets;
    } catch (error: any) {
      logger.error(`Failed to fetch tickets with tag "${tagName}":`, error.message);
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
  }

  /**
   * Fetch messages for a specific ticket
   * GET /api/tickets/{ticket_id}/messages
   */
  async getTicketMessages(ticketId: number): Promise<any[]> {
    try {
      logger.info(`Fetching messages for ticket ${ticketId}...`);

      const response = await this.client.get(`/api/tickets/${ticketId}/messages`);
      const messages = response.data?.data || response.data || [];

      logger.success(`Retrieved ${messages.length} messages for ticket ${ticketId}`);
      return messages;
    } catch (error: any) {
      logger.error(`Failed to fetch messages for ticket ${ticketId}:`, error.message);
      throw new Error(`Failed to fetch ticket messages: ${error.message}`);
    }
  }

  /**
   * Fetch a single ticket with full details
   * GET /api/tickets/{ticket_id}
   */
  async getTicket(ticketId: number): Promise<any> {
    try {
      logger.info(`Fetching ticket ${ticketId}...`);

      const response = await this.client.get(`/api/tickets/${ticketId}`);

      logger.success(`Retrieved ticket ${ticketId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch ticket ${ticketId}:`, error.message);
      throw new Error(`Failed to fetch ticket: ${error.message}`);
    }
  }
}
