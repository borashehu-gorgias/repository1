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

  /**
   * Fetch FAQ tickets (optionally filtered by CSAT scores)
   * GET /api/tickets with optional CSAT filtering
   */
  async getFAQTicketsWithGoodCSAT(limit: number = 10, requireCSAT: boolean = false): Promise<any[]> {
    try {
      logger.info('Fetching FAQ tickets...');

      // Fetch more tickets to account for filtering
      const fetchLimit = Math.max(limit * 5, 50);
      const response = await this.client.get('/api/tickets', {
        params: {
          limit: fetchLimit,
          order_by: 'updated_datetime:desc'
          // Don't filter by status - let's get all recent tickets
        }
      });

      const allTickets = response.data?.data || response.data || [];

      if (requireCSAT) {
        // Filter for FAQ tickets with good CSAT (rating >= 4)
        const faqTicketsWithGoodCSAT = allTickets.filter((ticket: any) => {
          // Check if ticket has FAQ-related tags
          const ticketTags = ticket.tags || [];
          const isFAQ = ticketTags.some((tag: any) =>
            tag.name?.toLowerCase().includes('faq') ||
            tag.name?.toLowerCase().includes('question')
          );

          // Check CSAT score (satisfaction_score is typically 1-5, or could be in meta)
          const hasGoodCSAT =
            (ticket.satisfaction_score && ticket.satisfaction_score >= 4) ||
            (ticket.meta?.satisfaction_rating && ticket.meta.satisfaction_rating >= 4);

          return isFAQ && hasGoodCSAT;
        });

        // If not enough FAQ-tagged tickets, fall back to any tickets with good CSAT
        let tickets = faqTicketsWithGoodCSAT.slice(0, limit);

        if (tickets.length < limit) {
          logger.warn(`Only found ${tickets.length} FAQ tickets with good CSAT, including other tickets with good CSAT...`);
          const anyGoodCSAT = allTickets.filter((ticket: any) => {
            const hasGoodCSAT =
              (ticket.satisfaction_score && ticket.satisfaction_score >= 4) ||
              (ticket.meta?.satisfaction_rating && ticket.meta.satisfaction_rating >= 4);
            return hasGoodCSAT && !faqTicketsWithGoodCSAT.includes(ticket);
          });

          tickets = [...tickets, ...anyGoodCSAT].slice(0, limit);
        }

        logger.success(`Retrieved ${tickets.length} FAQ tickets with good CSAT`);
        return tickets;
      } else {
        // Just return recent closed tickets without CSAT filtering
        const tickets = allTickets.slice(0, limit);
        logger.success(`Retrieved ${tickets.length} tickets`);
        return tickets;
      }
    } catch (error: any) {
      logger.error('Failed to fetch FAQ tickets:', error.message);
      throw new Error(`Failed to fetch FAQ tickets: ${error.message}`);
    }
  }

  /**
   * Create a new ticket
   * POST /api/tickets
   */
  async createTicket(ticketData: {
    subject?: string;
    messages: Array<{
      channel: string;
      via: string;
      from_agent?: boolean;
      sender: {
        email?: string;
        name?: string;
      };
      body_text?: string;
      body_html?: string;
    }>;
    customer?: {
      email?: string;
      name?: string;
    };
    assignee_user?: {
      id: number;
    };
    assignee_team?: {
      id: number;
    };
    tags?: Array<{ name: string }>;
    channel?: string;
    via?: string;
  }): Promise<any> {
    try {
      if (this.config.dryRun) {
        logger.warn('[DRY RUN] Would create ticket:', ticketData);
        return { dry_run: true, ticket: ticketData };
      }

      logger.info('Creating new ticket...');

      const response = await this.client.post('/api/tickets', ticketData);

      logger.success(`Successfully created ticket ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create ticket:', error.message);
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  /**
   * Add tags to a ticket
   * PUT /api/tickets/{ticket_id}
   */
  async addTagsToTicket(ticketId: number, tags: string[]): Promise<any> {
    try {
      if (this.config.dryRun) {
        logger.warn(`[DRY RUN] Would add tags to ticket ${ticketId}:`, tags);
        return { dry_run: true, ticketId, tags };
      }

      logger.info(`Adding tags to ticket ${ticketId}...`);

      // Get current ticket to preserve existing tags
      const currentTicket = await this.getTicket(ticketId);
      const existingTags = currentTicket.tags || [];

      // Merge with new tags
      const allTags = [
        ...existingTags,
        ...tags.map(name => ({ name }))
      ];

      // Update ticket with merged tags
      const response = await this.client.put(`/api/tickets/${ticketId}`, {
        tags: allTags
      });

      logger.success(`Successfully added tags to ticket ${ticketId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to add tags to ticket ${ticketId}:`, error.message);
      throw new Error(`Failed to add tags: ${error.message}`);
    }
  }

  /**
   * Get AI agent integrations
   * GET /api/integrations to find AI agent integration
   */
  async getAIAgentIntegration(): Promise<any> {
    try {
      logger.info('Fetching AI agent integration...');

      const response = await this.client.get('/api/integrations');
      const integrations = response.data?.data || response.data || [];

      // Find AI agent integration
      const aiAgent = integrations.find((integration: any) =>
        integration.type === 'ai-agent' ||
        integration.name?.toLowerCase().includes('ai') ||
        integration.name?.toLowerCase().includes('agent')
      );

      if (!aiAgent) {
        logger.warn('No AI agent integration found');
        return null;
      }

      logger.success(`Found AI agent integration: ${aiAgent.name || aiAgent.id}`);
      return aiAgent;
    } catch (error: any) {
      logger.error('Failed to fetch AI agent integration:', error.message);
      throw new Error(`Failed to fetch AI agent: ${error.message}`);
    }
  }
}
