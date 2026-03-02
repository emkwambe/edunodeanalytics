/**
 * AI Usage API
 * ============
 *
 * Endpoints for tracking and monitoring AI usage and costs.
 *
 * GET /api/ai/usage - Get AI usage statistics for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { SecureAIProxy } from '@/lib/privacy/secure-ai-proxy';
import { captureException } from '@/lib/monitoring/sentry';

/**
 * GET /api/ai/usage
 * Get AI usage statistics for a school
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = request.nextUrl.searchParams.get('schoolId');
    const period = request.nextUrl.searchParams.get('period') || 'month'; // month, quarter, year

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Missing required parameter: schoolId' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch usage data from database
    const { data: usageData, error: usageError } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('school_id', schoolId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (usageError) {
      // Table might not exist yet, return mock data
      console.warn('[AI Usage] Database query failed, using in-memory stats:', usageError);

      // Fall back to in-memory stats
      const memoryStats = SecureAIProxy.getUsageStats(schoolId);

      return NextResponse.json({
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        summary: {
          totalRequests: memoryStats.currentMonth.requests,
          totalTokens: memoryStats.currentMonth.tokens,
          totalCost: memoryStats.currentMonth.cost,
          avgLatency: 0,
          successRate: 1,
        },
        byProvider: [],
        byFeature: [],
        previousPeriod: {
          totalRequests: memoryStats.lastMonth.requests,
          totalTokens: memoryStats.lastMonth.tokens,
          totalCost: memoryStats.lastMonth.cost,
        },
        limits: null,
        source: 'memory',
      });
    }

    // Calculate summary statistics
    const summary = {
      totalRequests: usageData?.length || 0,
      totalTokens: usageData?.reduce((sum, u) => sum + (u.input_tokens + u.output_tokens), 0) || 0,
      totalCost: (usageData?.reduce((sum, u) => sum + u.cost_cents, 0) || 0) / 100, // Convert to dollars
      avgLatency: usageData?.length
        ? Math.round(usageData.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / usageData.length)
        : 0,
      successRate: usageData?.length
        ? usageData.filter((u) => u.success).length / usageData.length
        : 1,
    };

    // Group by provider
    const byProvider = Object.entries(
      usageData?.reduce(
        (acc, u) => {
          if (!acc[u.provider]) {
            acc[u.provider] = { requests: 0, tokens: 0, cost: 0 };
          }
          acc[u.provider].requests++;
          acc[u.provider].tokens += u.input_tokens + u.output_tokens;
          acc[u.provider].cost += u.cost_cents / 100;
          return acc;
        },
        {} as Record<string, { requests: number; tokens: number; cost: number }>
      ) || {}
    ).map(([provider, stats]) => ({ provider, ...stats }));

    // Group by feature
    const byFeature = Object.entries(
      usageData?.reduce(
        (acc, u) => {
          if (!acc[u.feature]) {
            acc[u.feature] = { requests: 0, tokens: 0, cost: 0 };
          }
          acc[u.feature].requests++;
          acc[u.feature].tokens += u.input_tokens + u.output_tokens;
          acc[u.feature].cost += u.cost_cents / 100;
          return acc;
        },
        {} as Record<string, { requests: number; tokens: number; cost: number }>
      ) || {}
    ).map(([feature, stats]) => ({ feature, ...stats }));

    // Get usage limits
    const { data: limits } = await supabase
      .from('ai_usage_limits')
      .select('*')
      .eq('school_id', schoolId)
      .single();

    // Calculate previous period for comparison
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (period) {
      case 'quarter':
        prevStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 3, 1);
        prevEndDate = startDate;
        break;
      case 'year':
        prevStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
        prevEndDate = startDate;
        break;
      case 'month':
      default:
        prevStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        prevEndDate = startDate;
    }

    const { data: prevUsageData } = await supabase
      .from('ai_usage')
      .select('input_tokens, output_tokens, cost_cents')
      .eq('school_id', schoolId)
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', prevEndDate.toISOString());

    const previousPeriod = {
      totalRequests: prevUsageData?.length || 0,
      totalTokens: prevUsageData?.reduce((sum, u) => sum + (u.input_tokens + u.output_tokens), 0) || 0,
      totalCost: (prevUsageData?.reduce((sum, u) => sum + u.cost_cents, 0) || 0) / 100,
    };

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary,
      byProvider,
      byFeature,
      previousPeriod,
      limits: limits
        ? {
            monthlyTokenLimit: limits.monthly_token_limit,
            monthlyCostLimit: limits.monthly_cost_limit_cents
              ? limits.monthly_cost_limit_cents / 100
              : null,
            currentUsagePercent: limits.monthly_token_limit
              ? (limits.current_month_tokens / limits.monthly_token_limit) * 100
              : null,
          }
        : null,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    captureException(error, { route: 'GET /api/ai/usage' });

    return NextResponse.json(
      { error: 'Failed to fetch AI usage' },
      { status: 500 }
    );
  }
}
