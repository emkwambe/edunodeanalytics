/**
 * Data Source OAuth API
 * =====================
 *
 * GET /api/data/sources/[sourceId]/oauth - Get OAuth authorization URL
 * POST /api/data/sources/[sourceId]/oauth - Handle OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DataSourceRegistry } from '@/lib/data/sources';

// Ensure adapters are registered
import '@/lib/data/sources';

interface RouteParams {
  params: Promise<{ sourceId: string }>;
}

/**
 * GET /api/data/sources/[sourceId]/oauth
 * Get the OAuth authorization URL for a data source
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const schoolSlug = request.nextUrl.searchParams.get('school');

    if (!schoolSlug) {
      return NextResponse.json(
        { error: 'Missing required parameter: school' },
        { status: 400 }
      );
    }

    const adapter = DataSourceRegistry.get(sourceId);
    if (!adapter) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    if (!adapter.usesOAuth || !adapter.getOAuthUrl) {
      return NextResponse.json(
        { error: 'This data source does not use OAuth' },
        { status: 400 }
      );
    }

    // Build the redirect URI for the callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/data/sources/${sourceId}/oauth/callback`;

    const authUrl = adapter.getOAuthUrl(schoolSlug, redirectUri);

    return NextResponse.json({
      authUrl,
      redirectUri,
      provider: adapter.name,
    });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data/sources/[sourceId]/oauth
 * Handle OAuth callback and exchange code for credentials
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const body = await request.json();
    const { code, schoolSlug, redirectUri } = body;

    if (!code || !schoolSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: code, schoolSlug' },
        { status: 400 }
      );
    }

    const adapter = DataSourceRegistry.get(sourceId);
    if (!adapter) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    if (!adapter.usesOAuth || !adapter.handleOAuthCallback) {
      return NextResponse.json(
        { error: 'This data source does not use OAuth' },
        { status: 400 }
      );
    }

    // Exchange code for credentials
    const result = await adapter.handleOAuthCallback(schoolSlug, code, redirectUri);

    // Test the connection with the new credentials
    const testResult = await adapter.testConnection(result.credentials);

    if (!testResult.success) {
      return NextResponse.json(
        {
          error: 'OAuth succeeded but connection test failed',
          message: testResult.message,
        },
        { status: 400 }
      );
    }

    // In production, save the credentials to database
    // await db.dataSourceConfigs.upsert({
    //   where: { schoolId_sourceId: { schoolId, sourceId } },
    //   create: {
    //     schoolId,
    //     sourceId,
    //     credentials: result.credentials,
    //     syncFrequency: adapter.defaultFrequency,
    //     enabled: true,
    //   },
    //   update: {
    //     credentials: result.credentials,
    //     enabled: true,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${adapter.name}`,
      metadata: testResult.metadata,
      connectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to complete OAuth flow' },
      { status: 500 }
    );
  }
}
