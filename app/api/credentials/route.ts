import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Accept either OAuth accessToken or direct longJWT login
    if (!session.accessToken && !session.longJWT) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { username, apiKey } = body;

    if (!username || !apiKey) {
      return NextResponse.json(
        { error: 'Username and API key are required' },
        { status: 400 }
      );
    }

    // Store in session
    session.gorgiasUsername = username;
    session.gorgiasApiKey = apiKey;
    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Credentials saved to session',
    });
  } catch (error: any) {
    console.error('Error saving credentials:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Accept either OAuth accessToken or direct longJWT login
    if (!session.accessToken && !session.longJWT) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      hasCredentials: !!(session.gorgiasUsername && session.gorgiasApiKey),
      username: session.gorgiasUsername || null,
    });
  } catch (error: any) {
    console.error('Error checking credentials:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

