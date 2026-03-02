/**
 * Data Source Registry
 * ====================
 *
 * Plug-and-play architecture for adding new data integrations.
 * Each adapter implements a common interface for consistent UX.
 *
 * Categories:
 * - sis: Student Information Systems (Clever, ClassLink, PowerSchool)
 * - assessment: Assessment Platforms (NWEA MAP, iReady, Renaissance STAR)
 * - lms: Learning Management Systems (Canvas, Google Classroom, Schoology)
 * - behavior: Behavior Tracking (PBIS, DeansList)
 * - finance: Financial Systems (for fiscal reporting)
 */

export type DataSourceCategory = 'sis' | 'assessment' | 'lms' | 'behavior' | 'finance';

export type SyncStatus = 'connected' | 'syncing' | 'error' | 'disconnected' | 'pending_auth' | 'pending' | 'failed';

export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';

/**
 * Credential field definition for dynamic form generation
 */
export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'oauth';
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: { value: string; label: string }[]; // For select type
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt: Date;
  nextSyncAt?: Date;
}

export interface SyncError {
  code: string;
  message: string;
  recordId?: string;
  field?: string;
}

/**
 * Current status of a data source connection
 */
export interface DataSourceStatus {
  status: SyncStatus;
  lastSyncAt: Date | null;
  lastSyncResult: SyncResult | null;
  nextSyncAt: Date | null;
  recordCount: number;
  errorMessage?: string;
}

/**
 * Configuration stored per school for a data source
 */
export interface DataSourceConfig {
  sourceId: string;
  schoolId: string;
  enabled: boolean;
  credentials: Record<string, string>;
  syncFrequency: SyncFrequency;
  lastSyncAt: Date | null;
  settings: Record<string, unknown>;
}

/**
 * Data tables that an adapter can populate
 */
export type DataTable =
  | 'students'
  | 'staff'
  | 'sections'
  | 'enrollments'
  | 'attendance'
  | 'assessments'
  | 'grades'
  | 'behavior_incidents'
  | 'interventions';

/**
 * Core adapter interface that all data sources must implement
 */
export interface DataSourceAdapter {
  /** Unique identifier for this data source */
  id: string;

  /** Display name */
  name: string;

  /** Short description */
  description: string;

  /** Category for grouping in UI */
  category: DataSourceCategory;

  /** Icon name (lucide icon) */
  icon: string;

  /** Brand color for UI */
  brandColor: string;

  /** Logo URL (optional) */
  logoUrl?: string;

  /** Which data tables this adapter populates */
  tables: DataTable[];

  /** Available sync frequencies */
  supportedFrequencies: SyncFrequency[];

  /** Default sync frequency */
  defaultFrequency: SyncFrequency;

  /** Credential fields needed for connection */
  credentialFields: CredentialField[];

  /** Whether this adapter uses OAuth flow */
  usesOAuth: boolean;

  /** OAuth configuration (if usesOAuth is true) */
  oauthConfig?: {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
  };

  /** Minimum subscription tier required */
  requiredTier: 'starter' | 'pro' | 'enterprise';

  /** Test the connection with provided credentials */
  testConnection(credentials: Record<string, string>): Promise<{
    success: boolean;
    message: string;
    metadata?: Record<string, unknown>;
  }>;

  /** Perform a full sync */
  sync(
    schoolId: string,
    credentials: Record<string, string>,
    options?: {
      fullSync?: boolean;
      since?: Date;
      tables?: DataTable[];
    }
  ): Promise<SyncResult>;

  /** Get current status for a school */
  getStatus(schoolId: string): Promise<DataSourceStatus>;

  /** Get OAuth authorization URL (if usesOAuth) */
  getOAuthUrl?(schoolId: string, redirectUri: string): string;

  /** Handle OAuth callback (if usesOAuth) */
  handleOAuthCallback?(
    schoolId: string,
    code: string,
    redirectUri: string
  ): Promise<{ credentials: Record<string, string> }>;
}

/**
 * Registry of all available data source adapters
 */
class DataSourceRegistryClass {
  private adapters: Map<string, DataSourceAdapter> = new Map();

  /**
   * Register a new adapter
   */
  register(adapter: DataSourceAdapter): void {
    if (this.adapters.has(adapter.id)) {
      console.warn(`Adapter ${adapter.id} is already registered. Overwriting.`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Get an adapter by ID
   */
  get(id: string): DataSourceAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get all registered adapters
   */
  getAll(): DataSourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters by category
   */
  getByCategory(category: DataSourceCategory): DataSourceAdapter[] {
    return this.getAll().filter((a) => a.category === category);
  }

  /**
   * Get adapters available for a subscription tier
   */
  getForTier(tier: 'starter' | 'pro' | 'enterprise'): DataSourceAdapter[] {
    const tierHierarchy = { starter: 1, pro: 2, enterprise: 3 };
    const tierLevel = tierHierarchy[tier];

    return this.getAll().filter((a) => {
      const requiredLevel = tierHierarchy[a.requiredTier];
      return requiredLevel <= tierLevel;
    });
  }

  /**
   * Get adapters that populate a specific table
   */
  getByTable(table: DataTable): DataSourceAdapter[] {
    return this.getAll().filter((a) => a.tables.includes(table));
  }

  /**
   * Check if an adapter is registered
   */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /**
   * Get count of registered adapters
   */
  get count(): number {
    return this.adapters.size;
  }
}

// Singleton instance
export const DataSourceRegistry = new DataSourceRegistryClass();

/**
 * Helper to create a base adapter with common defaults
 */
export function createAdapter(
  config: Omit<DataSourceAdapter, 'testConnection' | 'sync' | 'getStatus'> & {
    testConnection: DataSourceAdapter['testConnection'];
    sync: DataSourceAdapter['sync'];
    getStatus: DataSourceAdapter['getStatus'];
    getOAuthUrl?: DataSourceAdapter['getOAuthUrl'];
    handleOAuthCallback?: DataSourceAdapter['handleOAuthCallback'];
  }
): DataSourceAdapter {
  return {
    ...config,
  };
}

/**
 * Category metadata for UI display
 */
export const DATA_SOURCE_CATEGORIES: Record<
  DataSourceCategory,
  { name: string; description: string; icon: string }
> = {
  sis: {
    name: 'Student Information Systems',
    description: 'Roster, demographics, and enrollment data',
    icon: 'Users',
  },
  assessment: {
    name: 'Assessment Platforms',
    description: 'Test scores, growth metrics, and proficiency data',
    icon: 'GraduationCap',
  },
  lms: {
    name: 'Learning Management',
    description: 'Assignments, grades, and course progress',
    icon: 'BookOpen',
  },
  behavior: {
    name: 'Behavior & MTSS',
    description: 'Behavior incidents, interventions, and PBIS data',
    icon: 'Heart',
  },
  finance: {
    name: 'Financial Systems',
    description: 'Budget, expenditures, and fiscal reporting',
    icon: 'DollarSign',
  },
};
