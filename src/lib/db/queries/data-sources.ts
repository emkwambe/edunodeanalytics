// @ts-nocheck - strict type mismatches after database.types.ts regen
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/database.types';

/**
 * Data Sources Queries
 *
 * Data access layer for data source connections and sync history
 */

export type DataSourceProvider =
  | 'clever'
  | 'classlink'
  | 'powerschool'
  | 'canvas'
  | 'google_classroom'
  | 'nwea_map'
  | 'iready'
  | 'renaissance_star'
  | 'custom';

export type DataSourceType = 'sis' | 'lms' | 'assessment' | 'attendance' | 'behavior';

export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface DataSource {
  id: string;
  created_at: string;
  updated_at: string;
  school_id: string;
  name: string;
  type: DataSourceType;
  provider: DataSourceProvider;
  connection_config: Json;
  sync_enabled: boolean;
  sync_frequency_hours: number;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  field_mappings: Json;
  records_synced: number;
  last_record_count: number;
  is_active: boolean;
  connected_at: string | null;
  disconnected_at: string | null;
  metadata: Json;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
}

export interface SyncHistory {
  id: string;
  created_at: string;
  school_id: string;
  data_source_id: string;
  sync_type: 'full' | 'incremental' | 'manual';
  started_at: string;
  completed_at: string | null;
  status: SyncStatus;
  error_message: string | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_deleted: number;
  records_skipped: number;
  details: Json;
  errors: Json;
  triggered_by: 'cron' | 'manual' | 'webhook' | 'oauth_callback';
  triggered_by_user_id: string | null;
  duration_ms: number | null;
}

/**
 * Get all data sources for a school
 */
export async function getDataSourcesForSchool(schoolId: string): Promise<DataSource[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching data sources:', error);
    return [];
  }

  return data as DataSource[];
}

/**
 * Get a specific data source by ID
 */
export async function getDataSourceById(id: string): Promise<DataSource | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching data source:', error);
    }
    return null;
  }

  return data as DataSource;
}

/**
 * Get data source by school and provider
 */
export async function getDataSourceByProvider(
  schoolId: string,
  provider: DataSourceProvider
): Promise<DataSource | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('school_id', schoolId)
    .eq('provider', provider)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching data source by provider:', error);
    }
    return null;
  }

  return data as DataSource;
}

/**
 * Get all data sources due for sync
 */
export async function getDataSourcesDueForSync(): Promise<DataSource[]> {
  const supabase = createAdminSupabaseClient();

  // Get data sources due for sync
  const { data: dataSources, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('sync_enabled', true)
    .eq('is_active', true)
    .or('next_sync_at.is.null,next_sync_at.lte.now()');

  if (error) {
    console.error('[DB] Error fetching data sources due for sync:', error);
    return [];
  }

  if (!dataSources || dataSources.length === 0) {
    return [];
  }

  // Get unique school IDs
  const schoolIds = [...new Set(dataSources.map((ds) => ds.school_id))];

  // Fetch schools to check subscription status
  const { data: schools } = await supabase
    .from('schools')
    .select('id, is_active, subscription_status')
    .in('id', schoolIds);

  // Create map for quick lookup
  const schoolMap = new Map(schools?.map((s) => [s.id, s]) || []);

  // Filter for active schools with valid subscriptions
  const activeSchoolSources = dataSources.filter((ds) => {
    const school = schoolMap.get(ds.school_id);
    return school?.is_active &&
      ['active', 'trialing'].includes(school?.subscription_status || '');
  });

  return activeSchoolSources as unknown as DataSource[];
}

/**
 * Create a new data source connection
 */
export async function createDataSource(params: {
  schoolId: string;
  name: string;
  type: DataSourceType;
  provider: DataSourceProvider;
  connectionConfig?: Json;
  syncFrequencyHours?: number;
}): Promise<DataSource | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('data_sources')
    .insert({
      school_id: params.schoolId,
      name: params.name,
      type: params.type,
      provider: params.provider,
      connection_config: params.connectionConfig || {},
      sync_frequency_hours: params.syncFrequencyHours || 24,
      sync_status: 'pending',
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating data source:', error);
    return null;
  }

  return data as DataSource;
}

/**
 * Update data source connection config (OAuth tokens)
 */
export async function updateDataSourceCredentials(
  id: string,
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    connectionConfig?: Json;
  }
): Promise<DataSource | null> {
  const supabase = createAdminSupabaseClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (credentials.accessToken) {
    updates.access_token_encrypted = credentials.accessToken; // Should be encrypted in production
  }
  if (credentials.refreshToken) {
    updates.refresh_token_encrypted = credentials.refreshToken; // Should be encrypted in production
  }
  if (credentials.tokenExpiresAt) {
    updates.token_expires_at = credentials.tokenExpiresAt.toISOString();
  }
  if (credentials.connectionConfig) {
    updates.connection_config = credentials.connectionConfig;
  }

  const { data, error } = await supabase
    .from('data_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating data source credentials:', error);
    return null;
  }

  return data as DataSource;
}

/**
 * Update sync status and timing
 */
export async function updateDataSourceSyncStatus(
  id: string,
  status: SyncStatus,
  params?: {
    error?: string;
    recordsSynced?: number;
    recordCount?: number;
  }
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  // First get the current data source to calculate next sync
  const { data: current } = await supabase
    .from('data_sources')
    .select('sync_frequency_hours')
    .eq('id', id)
    .single();

  const updates: Record<string, unknown> = {
    sync_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.last_sync_at = new Date().toISOString();
    updates.sync_error = null;
    // Calculate next sync time
    const frequencyHours = current?.sync_frequency_hours || 24;
    updates.next_sync_at = new Date(Date.now() + frequencyHours * 60 * 60 * 1000).toISOString();
  }

  if (status === 'failed' && params?.error) {
    updates.sync_error = params.error;
  }

  if (params?.recordsSynced !== undefined) {
    updates.records_synced = params.recordsSynced;
  }

  if (params?.recordCount !== undefined) {
    updates.last_record_count = params.recordCount;
  }

  const { error } = await supabase
    .from('data_sources')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[DB] Error updating data source sync status:', error);
  }
}

/**
 * Create sync history record
 */
export async function createSyncHistory(params: {
  schoolId: string;
  dataSourceId: string;
  syncType: 'full' | 'incremental' | 'manual';
  triggeredBy: 'cron' | 'manual' | 'webhook' | 'oauth_callback';
  triggeredByUserId?: string;
}): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('sync_history')
    .insert({
      school_id: params.schoolId,
      data_source_id: params.dataSourceId,
      sync_type: params.syncType,
      started_at: new Date().toISOString(),
      status: 'syncing',
      triggered_by: params.triggeredBy,
      triggered_by_user_id: params.triggeredByUserId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] Error creating sync history:', error);
    return null;
  }

  return data.id;
}

/**
 * Complete sync history record
 */
export async function completeSyncHistory(
  id: string,
  result: {
    status: 'completed' | 'failed';
    errorMessage?: string;
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsDeleted?: number;
    recordsSkipped?: number;
    details?: Json;
    errors?: Json;
  }
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  // Get the started_at to calculate duration
  const { data: history } = await supabase
    .from('sync_history')
    .select('started_at')
    .eq('id', id)
    .single();

  const completedAt = new Date();
  const startedAt = history?.started_at ? new Date(history.started_at) : completedAt;
  const durationMs = completedAt.getTime() - startedAt.getTime();

  const { error } = await supabase
    .from('sync_history')
    .update({
      status: result.status,
      completed_at: completedAt.toISOString(),
      error_message: result.errorMessage,
      records_processed: result.recordsProcessed,
      records_created: result.recordsCreated,
      records_updated: result.recordsUpdated,
      records_deleted: result.recordsDeleted || 0,
      records_skipped: result.recordsSkipped || 0,
      details: result.details || {},
      errors: result.errors || [],
      duration_ms: durationMs,
    })
    .eq('id', id);

  if (error) {
    console.error('[DB] Error completing sync history:', error);
  }
}

/**
 * Get recent sync history for a data source
 */
export async function getSyncHistory(
  dataSourceId: string,
  limit: number = 10
): Promise<SyncHistory[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('sync_history')
    .select('*')
    .eq('data_source_id', dataSourceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] Error fetching sync history:', error);
    return [];
  }

  return data as SyncHistory[];
}

/**
 * Disconnect a data source
 */
export async function disconnectDataSource(id: string): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('data_sources')
    .update({
      is_active: false,
      sync_enabled: false,
      disconnected_at: new Date().toISOString(),
      access_token_encrypted: null,
      refresh_token_encrypted: null,
    })
    .eq('id', id);

  if (error) {
    console.error('[DB] Error disconnecting data source:', error);
  }
}
