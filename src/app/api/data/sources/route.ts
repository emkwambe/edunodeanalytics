/**
 * Data Sources API
 * ================
 *
 * Endpoints for managing data source connections and syncs.
 *
 * GET /api/data/sources - List all available data sources
 * GET /api/data/sources?school=<slug> - Get connected sources for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  DataSourceRegistry,
  DATA_SOURCE_CATEGORIES,
  type DataSourceCategory,
} from '@/lib/data/sources';

// Ensure adapters are registered
import '@/lib/data/sources';

/**
 * GET /api/data/sources
 * List available data sources, optionally filtered by category or school
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as DataSourceCategory | null;
    const tier = searchParams.get('tier') as 'starter' | 'pro' | 'enterprise' | null;
    const schoolSlug = searchParams.get('school');

    // Get adapters based on filters
    let adapters = DataSourceRegistry.getAll();

    if (category) {
      adapters = adapters.filter((a) => a.category === category);
    }

    if (tier) {
      adapters = DataSourceRegistry.getForTier(tier);
      if (category) {
        adapters = adapters.filter((a) => a.category === category);
      }
    }

    // Transform adapters to API response format
    const sources = await Promise.all(
      adapters.map(async (adapter) => {
        let status = null;

        // If school is provided, get connection status
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

        return {
          id: adapter.id,
          name: adapter.name,
          description: adapter.description,
          category: adapter.category,
          categoryName: DATA_SOURCE_CATEGORIES[adapter.category].name,
          icon: adapter.icon,
          brandColor: adapter.brandColor,
          logoUrl: adapter.logoUrl,
          tables: adapter.tables,
          supportedFrequencies: adapter.supportedFrequencies,
          defaultFrequency: adapter.defaultFrequency,
          requiredTier: adapter.requiredTier,
          usesOAuth: adapter.usesOAuth,
          credentialFields: adapter.credentialFields.map((f) => ({
            ...f,
            // Don't expose password field types in listings
            type: f.type === 'password' ? 'text' : f.type,
          })),
          status,
        };
      })
    );

    // Group by category if requested
    const groupByCategory = searchParams.get('groupByCategory') === 'true';

    if (groupByCategory) {
      const grouped = Object.entries(DATA_SOURCE_CATEGORIES).map(([key, meta]) => ({
        category: key,
        ...meta,
        sources: sources.filter((s) => s.category === key),
      }));

      return NextResponse.json({
        categories: grouped.filter((g) => g.sources.length > 0),
        totalSources: sources.length,
      });
    }

    return NextResponse.json({
      sources,
      totalSources: sources.length,
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 }
    );
  }
}
