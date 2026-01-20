import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GorgiasApiClient } from '@/lib/core/api-client';
import { Config } from '@/lib/core/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Accept either OAuth accessToken or direct longJWT login
    if (!session.accessToken && !session.longJWT) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has provided API credentials
    if (!session.gorgiasUsername || !session.gorgiasApiKey) {
      return NextResponse.json(
        { error: 'Gorgias API credentials required. Please configure them in Settings.' },
        { status: 400 }
      );
    }

    if (!session.subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found in session' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sourceTickets } = body;

    if (!sourceTickets || !Array.isArray(sourceTickets)) {
      return NextResponse.json(
        { error: 'sourceTickets array is required' },
        { status: 400 }
      );
    }

    // Create config for API client using stored credentials
    const config: Config = {
      gorgiasSubdomain: session.subdomain,
      gorgiasApiKey: session.gorgiasApiKey,
      gorgiasUsername: session.gorgiasUsername,
      gorgiasClientId: process.env.GORGIAS_CLIENT_ID || '',
      gorgiasClientSecret: process.env.GORGIAS_CLIENT_SECRET || '',
      oauthRedirectUri: process.env.OAUTH_REDIRECT_URI || '',
      logLevel: 'info',
      dryRun: false,
    };

    const client = new GorgiasApiClient(config);

    // Get AI agent integration
    const aiAgent = await client.getAIAgentIntegration();

    const createdTickets = [];
    const errors = [];

    // Create test tickets from source tickets
    for (const sourceTicket of sourceTickets) {
      try {
        // Extract customer question from messages
        const customerMessage = sourceTicket.messages?.find(
          (msg: any) => !msg.from_agent
        );

        if (!customerMessage) {
          errors.push({
            sourceTicketId: sourceTicket.id,
            error: 'No customer message found'
          });
          continue;
        }

        // Create new ticket data
        const ticketData = {
          subject: `AI Test: ${sourceTicket.subject || 'Test Ticket'}`,
          messages: [
            {
              channel: 'email',
              via: 'api',
              from_agent: false,
              sender: {
                email: customerMessage.sender?.email || 'test@example.com',
                name: customerMessage.sender?.name || 'Test Customer'
              },
              body_text: customerMessage.body_text || customerMessage.body_html || '',
              body_html: customerMessage.body_html || customerMessage.body_text || ''
            }
          ],
          customer: {
            email: sourceTicket.customer?.email || 'test@example.com',
            name: sourceTicket.customer?.name || 'Test Customer'
          },
          tags: [
            { name: 'ai-agent-test' },
            { name: 'ai-evaluation' }
          ],
          channel: 'email',
          via: 'api'
        };

        // Add AI agent assignment if available
        if (aiAgent && aiAgent.id) {
          // Note: Assignment to AI agent might require specific integration
          // This might need adjustment based on your Gorgias setup
          ticketData.tags.push({ name: `ai-agent-${aiAgent.id}` });
        }

        // Create the ticket
        const newTicket = await client.createTicket(ticketData);

        createdTickets.push({
          sourceTicketId: sourceTicket.id,
          newTicketId: newTicket.id,
          newTicket: newTicket
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`Failed to create ticket from source ${sourceTicket.id}:`, error);
        errors.push({
          sourceTicketId: sourceTicket.id,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: createdTickets.length,
      tickets: createdTickets,
      errors: errors.length > 0 ? errors : undefined,
      aiAgent: aiAgent ? { id: aiAgent.id, name: aiAgent.name } : null
    });

  } catch (error: any) {
    console.error('Error creating AI test tickets:', error);
    return NextResponse.json(
      {
        error: 'Failed to create AI test tickets',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    // Accept either OAuth accessToken or direct longJWT login
    if (!session.accessToken && !session.longJWT) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has provided API credentials
    if (!session.gorgiasUsername || !session.gorgiasApiKey) {
      return NextResponse.json(
        { error: 'Gorgias API credentials required. Please configure them in Settings.' },
        { status: 400 }
      );
    }

    if (!session.subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found in session' },
        { status: 400 }
      );
    }

    // Create config for API client using stored credentials
    const config: Config = {
      gorgiasSubdomain: session.subdomain,
      gorgiasApiKey: session.gorgiasApiKey,
      gorgiasUsername: session.gorgiasUsername,
      gorgiasClientId: process.env.GORGIAS_CLIENT_ID || '',
      gorgiasClientSecret: process.env.GORGIAS_CLIENT_SECRET || '',
      oauthRedirectUri: process.env.OAUTH_REDIRECT_URI || '',
      logLevel: 'info',
      dryRun: false,
    };

    const client = new GorgiasApiClient(config);

    // Fetch test tickets with the ai-agent-test tag
    const testTickets = await client.getTicketsWithTag('ai-agent-test');

    // Fetch messages for each ticket
    const ticketsWithMessages = await Promise.all(
      testTickets.map(async (ticket) => {
        try {
          const messages = await client.getTicketMessages(ticket.id);
          return {
            ...ticket,
            messages
          };
        } catch (error) {
          console.error(`Failed to fetch messages for ticket ${ticket.id}:`, error);
          return {
            ...ticket,
            messages: []
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      tickets: ticketsWithMessages,
      count: ticketsWithMessages.length
    });

  } catch (error: any) {
    console.error('Error fetching AI test tickets:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch AI test tickets',
        message: error.message
      },
      { status: 500 }
    );
  }
}
