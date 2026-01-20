import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GorgiasApiClient } from '@/lib/core/api-client';
import { Config } from '@/lib/core/types';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const viewName = searchParams.get('view') || 'new view'; // Default to 'new view'

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

    // Fetch FAQ tickets from the specified view
    const tickets = await client.getFAQTicketsWithGoodCSAT(limit, false, viewName);

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
