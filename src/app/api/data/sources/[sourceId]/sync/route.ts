/**
 * Data Source Sync API
 * ====================
 *
 * POST /api/data/sources/[sourceId]/sync - Trigger a sync
 * GET /api/data/sources/[sourceId]/sync - Get sync history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DataSourceRegistry, type SyncResult } from '@/lib/data/sources';

// Ensure adapters are registered
import '@/lib/data/sources';

interface RouteParams {
  params: Promise<{ sourceId: string }>;
}

// In-memory sync history for demo (would be database in production)
const syncHistory: Map<string, SyncResult[]> = new Map();

/**
 * POST /api/data/sources/[sourceId]/sync
 * Trigger a data sync
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const body = await request.json();
    const { schoolSlug, fullSync = false, tables } = body;

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

    // In production, fetch credentials from database
    // const config = await db.dataSourceConfigs.findUnique({
    //   where: { schoolId_sourceId: { schoolId, sourceId } },
    // });

    // Mock credentials for demo
    const credentials = {
      api_key: 'demo_key',
      district_id: 'demo_district',
    };

    // Run the sync
    const result = await adapter.sync(schoolSlug, credentials, {
      fullSync,
      tables,
    });

    // Store in history
    const key = `${schoolSlug}:${sourceId}`;
    const history = syncHistory.get(key) || [];
    history.unshift(result);
    syncHistory.set(key, history.slice(0, 50)); // Keep last 50 syncs

    // In production, save to database
    // await db.syncHistory.create({
    //   data: {
    //     schoolId,
    //     sourceId,
    //     ...result,
    //   },
    // });

    return NextResponse.json({
      success: result.success,
      syncId: `sync_${Date.now()}`,
      result,
    });
  } catch (error) {
    console.error('Error running sync:', error);
    return NextResponse.json(
      { error: 'Failed to run sync' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/data/sources/[sourceId]/sync
 * Get sync history for a data source
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const schoolSlug = searchParams.get('school');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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

    // Get from in-memory store (would be database in production)
    const key = `${schoolSlug}:${sourceId}`;
    const history = syncHistory.get(key) || [];

    // Generate mock history if empty
    if (history.length === 0) {
      const mockHistory: SyncResult[] = Array.from({ length: 5 }, (_, i) => ({
        success: Math.random() > 0.1,
        recordsProcessed: 400 + Math.floor(Math.random() * 100),
        recordsCreated: Math.floor(Math.random() * 20),
        recordsUpdated: Math.floor(Math.random() * 50),
        recordsSkipped: Math.floor(Math.random() * 5),
        errors: [],
        startedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 3000),
      }));
      return NextResponse.json({
        history: mockHistory.slice(0, limit),
        total: mockHistory.length,
      });
    }

    return NextResponse.json({
      history: history.slice(0, limit),
      total: history.length,
    });
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}
