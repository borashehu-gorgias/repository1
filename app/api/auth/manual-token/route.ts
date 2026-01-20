import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { decode } from 'jsonwebtoken';

/**
 * Manual token entry endpoint
 * 
 * For cases where programmatic login doesn't work:
 * - SSO-only accounts
 * - reCAPTCHA triggered
 * - Other edge cases
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subdomain, longJWT } = body;

        // Validate inputs
        if (!subdomain) {
            return NextResponse.json(
                { error: 'Subdomain is required' },
                { status: 400 }
            );
        }

        if (!longJWT || !longJWT.startsWith('eyJ')) {
            return NextResponse.json(
                { error: 'Invalid token format. Token should start with "eyJ"' },
                { status: 400 }
            );
        }

        // Decode and validate token
        const decoded: any = decode(longJWT);
        if (!decoded || !decoded.account_id) {
            return NextResponse.json(
                { error: 'Invalid token: could not decode or missing account_id' },
                { status: 400 }
            );
        }

        // Check expiration
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return NextResponse.json(
                { error: 'Token has expired. Please get a fresh token.' },
                { status: 400 }
            );
        }

        // Verify admin role
        const roles = decoded.roles || [];
        if (!roles.includes('admin')) {
            return NextResponse.json(
                {
                    error: 'Access denied. Only administrators can use this tool.',
                    roles: roles,
                },
                { status: 403 }
            );
        }

        // Store in session
        const session = await getSession();
        session.longJWT = longJWT;
        session.subdomain = subdomain;
        session.accountId = decoded.account_id;
        session.userId = decoded.user_id;
        await session.save();

        return NextResponse.json({
            success: true,
            subdomain,
            accountId: decoded.account_id,
            message: 'Token saved successfully',
        });

    } catch (error: any) {
        console.error('[ManualToken] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to save token' },
            { status: 500 }
        );
    }
}
