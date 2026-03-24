/**
 * Individual Data Source API
 * ==========================
 *
 * GET /api/data/sources/[sourceId] - Get source details and status
 * POST /api/data/sources/[sourceId] - Connect/configure a data source
 * DELETE /api/data/sources/[sourceId] - Disconnect a data source
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
 * GET /api/data/sources/[sourceId]
 * Get detailed info about a specific data source
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const schoolSlug = request.nextUrl.searchParams.get('school');

    const adapter = DataSourceRegistry.get(sourceId);
    if (!adapter) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    let status = null;
    if (schoolSlug) {
      try {
        status = await adapter.getStatus(schoolSlug);
      } catch {
        status = {
          status: 'disconnected',
          lastSyncAt: null,
          lastSyncResult: null,
          nextSyncAt: null,
          recordCount: 0,
        };
      }
    }

    return NextResponse.json({
      id: adapter.id,
      name: adapter.name,
      description: adapter.description,
      category: adapter.category,
      icon: adapter.icon,
      brandColor: adapter.brandColor,
      logoUrl: adapter.logoUrl,
      tables: adapter.tables,
      supportedFrequencies: adapter.supportedFrequencies,
      defaultFrequency: adapter.defaultFrequency,
      requiredTier: adapter.requiredTier,
      usesOAuth: adapter.usesOAuth,
      oauthConfig: adapter.oauthConfig,
      credentialFields: adapter.credentialFields,
      status,
    });
  } catch (error) {
    console.error('Error fetching data source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data source' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data/sources/[sourceId]
 * Connect or update a data source connection
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const body = await request.json();
    const { schoolSlug, credentials, syncFrequency, settings: _settings } = body;

    if (!schoolSlug) {
      return NextResponse.json(
        { error: 'Missing required field: schoolSlug' },
        { status: 400 }
      );
    }

    const adapter = DataSourceRegistry.get(sourceId);
    if (!adapter) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Test the connection first
    const testResult = await adapter.testConnection(credentials || {});
    if (!testResult.success) {
      return NextResponse.json(
        {
          error: 'Connection test failed',
          message: testResult.message,
        },
        { status: 400 }
      );
    }

    // In production, save the configuration to database
    // await db.dataSourceConfigs.upsert({
    //   where: { schoolId_sourceId: { schoolId, sourceId } },
    //   create: { schoolId, sourceId, credentials, syncFrequency, settings, enabled: true },
    //   update: { credentials, syncFrequency, settings, enabled: true },
    // });

    return NextResponse.json({
      success: true,
      message: testResult.message,
      metadata: testResult.metadata,
      config: {
        sourceId,
        schoolSlug,
        syncFrequency: syncFrequency || adapter.defaultFrequency,
        enabled: true,
        connectedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error connecting data source:', error);
    return NextResponse.json(
      { error: 'Failed to connect data source' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data/sources/[sourceId]
 * Disconnect a data source
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // In production, delete or disable the configuration
    // await db.dataSourceConfigs.delete({
    //   where: { schoolId_sourceId: { schoolId, sourceId } },
    // });

    return NextResponse.json({
      success: true,
      message: `Disconnected ${adapter.name}`,
      disconnectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error disconnecting data source:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect data source' },
      { status: 500 }
    );
  }
}
