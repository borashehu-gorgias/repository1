import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GorgiasApiClient } from '@/lib/core/api-client';
import { Config } from '@/lib/core/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.subdomain || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Create config for API client
    const config: Config = {
      gorgiasSubdomain: session.subdomain,
      gorgiasApiKey: session.accessToken,
      gorgiasUsername: session.userEmail || '',
      gorgiasClientId: process.env.GORGIAS_CLIENT_ID || '',
      gorgiasClientSecret: process.env.GORGIAS_CLIENT_SECRET || '',
      oauthRedirectUri: process.env.OAUTH_REDIRECT_URI || '',
      logLevel: 'info',
      dryRun: false,
    };

    const client = new GorgiasApiClient(config);

    // Fetch FAQ tickets with good CSAT
    const tickets = await client.getFAQTicketsWithGoodCSAT(limit);

    // Fetch messages for each ticket
    const ticketsWithMessages = await Promise.all(
      tickets.map(async (ticket) => {
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
    console.error('Error fetching FAQ tickets:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch FAQ tickets',
        message: error.message
      },
      { status: 500 }
    );
  }
}
