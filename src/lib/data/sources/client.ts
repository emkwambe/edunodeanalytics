/**
 * Client-safe Data Sources Module
 * ================================
 *
 * This module exports types and static metadata that can be safely
 * imported in client components without pulling in server-side code.
 *
 * For server-side operations (sync, testConnection, etc.), use:
 * import { DataSourceRegistry } from '@/lib/data/sources';
 */

export type DataSourceCategory = 'sis' | 'assessment' | 'lms' | 'behavior' | 'finance';

export type SyncStatus = 'connected' | 'syncing' | 'error' | 'disconnected' | 'pending_auth' | 'pending' | 'failed';

export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'oauth';
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: { value: string; label: string }[];
}

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
 * Client-safe adapter metadata (no async methods)
 */
export interface DataSourceMeta {
  id: string;
  name: string;
  description: string;
  category: DataSourceCategory;
  icon: string;
  brandColor: string;
  logoUrl?: string;
  tables: DataTable[];
  supportedFrequencies: SyncFrequency[];
  defaultFrequency: SyncFrequency;
  credentialFields: CredentialField[];
  usesOAuth: boolean;
  oauthConfig?: {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
  };
  requiredTier: 'starter' | 'pro' | 'enterprise';
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

/**
 * Static metadata for all available data sources
 * This allows client components to render the UI without importing server code
 */
export const DATA_SOURCE_ADAPTERS: DataSourceMeta[] = [
  {
    id: 'clever',
    name: 'Clever',
    description: 'Automatic roster sync and SSO through Clever\'s secure platform',
    category: 'sis',
    icon: 'Users',
    brandColor: '#4285F4',
    logoUrl: '/integrations/clever-logo.svg',
    tables: ['students', 'staff', 'sections', 'enrollments'],
    supportedFrequencies: ['realtime', 'daily', 'manual'],
    defaultFrequency: 'daily',
    credentialFields: [],
    usesOAuth: true,
    oauthConfig: {
      authUrl: 'https://clever.com/oauth/authorize',
      tokenUrl: 'https://clever.com/oauth/tokens',
      scopes: ['read:students', 'read:teachers', 'read:sections', 'read:school_admins'],
    },
    requiredTier: 'starter',
  },
  {
    id: 'powerschool',
    name: 'PowerSchool SIS',
    description: 'Direct integration with PowerSchool for comprehensive student data',
    category: 'sis',
    icon: 'Database',
    brandColor: '#1D4289',
    logoUrl: '/integrations/powerschool-logo.svg',
    tables: ['students', 'staff', 'sections', 'enrollments', 'attendance', 'grades'],
    supportedFrequencies: ['daily', 'weekly', 'manual'],
    defaultFrequency: 'daily',
    credentialFields: [
      {
        key: 'server_url',
        label: 'Server URL',
        type: 'url',
        placeholder: 'https://your-district.powerschool.com',
        required: true,
        helpText: 'Your PowerSchool server URL',
      },
      {
        key: 'client_id',
        label: 'Plugin Client ID',
        type: 'text',
        placeholder: 'Plugin Client ID',
        required: true,
        helpText: 'From your PowerSchool plugin configuration',
      },
      {
        key: 'client_secret',
        label: 'Plugin Client Secret',
        type: 'password',
        placeholder: 'Plugin Client Secret',
        required: true,
        helpText: 'Keep this secure - never share publicly',
      },
    ],
    usesOAuth: false,
    requiredTier: 'pro',
  },
  {
    id: 'nwea_map',
    name: 'NWEA MAP Growth',
    description: 'Import MAP Growth assessment data including RIT scores and growth metrics',
    category: 'assessment',
    icon: 'BarChart3',
    brandColor: '#0066CC',
    logoUrl: '/integrations/nwea-logo.svg',
    tables: ['assessments'],
    supportedFrequencies: ['daily', 'weekly', 'manual'],
    defaultFrequency: 'weekly',
    credentialFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your NWEA API Key',
        required: true,
        helpText: 'Generated in your NWEA admin portal under API Access',
      },
      {
        key: 'district_id',
        label: 'District ID',
        type: 'text',
        placeholder: 'NWEA District ID',
        required: true,
        helpText: 'Your NWEA district identifier',
      },
      {
        key: 'nwea_school_id',
        label: 'School ID (Optional)',
        type: 'text',
        placeholder: 'NWEA School ID',
        required: false,
        helpText: 'Filter results to a specific school within the district',
      },
    ],
    usesOAuth: false,
    requiredTier: 'starter',
  },
  {
    id: 'iready',
    name: 'i-Ready',
    description: 'Curriculum Associates i-Ready diagnostic and instructional data',
    category: 'assessment',
    icon: 'Target',
    brandColor: '#00A651',
    logoUrl: '/integrations/iready-logo.svg',
    tables: ['assessments'],
    supportedFrequencies: ['daily', 'weekly', 'manual'],
    defaultFrequency: 'weekly',
    credentialFields: [
      {
        key: 'username',
        label: 'Admin Username',
        type: 'text',
        placeholder: 'i-Ready admin username',
        required: true,
        helpText: 'Your i-Ready district administrator username',
      },
      {
        key: 'password',
        label: 'Admin Password',
        type: 'password',
        placeholder: 'i-Ready admin password',
        required: true,
        helpText: 'Your i-Ready district administrator password',
      },
      {
        key: 'district_id',
        label: 'District ID',
        type: 'text',
        placeholder: 'i-Ready District ID',
        required: true,
        helpText: 'Found in your i-Ready Connect settings',
      },
    ],
    usesOAuth: false,
    requiredTier: 'starter',
  },
  {
    id: 'renaissance_star',
    name: 'Renaissance Star',
    description: 'Star Assessments reading and math benchmark data',
    category: 'assessment',
    icon: 'Star',
    brandColor: '#0073CF',
    logoUrl: '/integrations/renaissance-logo.svg',
    tables: ['assessments'],
    supportedFrequencies: ['daily', 'weekly', 'manual'],
    defaultFrequency: 'weekly',
    credentialFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Renaissance API Client ID',
        required: true,
        helpText: 'From your Renaissance admin portal',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Renaissance API Client Secret',
        required: true,
        helpText: 'Keep this secure - never share publicly',
      },
      {
        key: 'platform_url',
        label: 'Platform URL',
        type: 'url',
        placeholder: 'https://global-zone.renaissance-go.com',
        required: false,
        helpText: 'Leave blank for default (global-zone)',
      },
    ],
    usesOAuth: false,
    requiredTier: 'starter',
  },
  {
    id: 'canvas',
    name: 'Canvas LMS',
    description: 'Instructure Canvas learning management system integration',
    category: 'lms',
    icon: 'BookOpen',
    brandColor: '#E03C31',
    logoUrl: '/integrations/canvas-logo.svg',
    tables: ['sections', 'enrollments', 'grades'],
    supportedFrequencies: ['daily', 'weekly', 'manual'],
    defaultFrequency: 'daily',
    credentialFields: [
      {
        key: 'canvas_url',
        label: 'Canvas URL',
        type: 'url',
        placeholder: 'https://yourschool.instructure.com',
        required: true,
        helpText: 'Your Canvas instance URL',
      },
      {
        key: 'access_token',
        label: 'Access Token',
        type: 'password',
        placeholder: 'Canvas API Access Token',
        required: true,
        helpText: 'Generated in Account Settings > Approved Integrations',
      },
    ],
    usesOAuth: false,
    requiredTier: 'pro',
  },
  {
    id: 'google_classroom',
    name: 'Google Classroom',
    description: 'Google Workspace for Education classroom and assignment data',
    category: 'lms',
    icon: 'GraduationCap',
    brandColor: '#0F9D58',
    logoUrl: '/integrations/google-classroom-logo.svg',
    tables: ['sections', 'enrollments', 'grades'],
    supportedFrequencies: ['daily', 'manual'],
    defaultFrequency: 'daily',
    credentialFields: [],
    usesOAuth: true,
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
      ],
    },
    requiredTier: 'starter',
  },
];

/**
 * Client-safe registry for accessing adapter metadata
 */
export const ClientDataSourceRegistry = {
  getAll(): DataSourceMeta[] {
    return DATA_SOURCE_ADAPTERS;
  },

  get(id: string): DataSourceMeta | undefined {
    return DATA_SOURCE_ADAPTERS.find((a) => a.id === id);
  },

  getByCategory(category: DataSourceCategory): DataSourceMeta[] {
    return DATA_SOURCE_ADAPTERS.filter((a) => a.category === category);
  },

  getForTier(tier: 'starter' | 'pro' | 'enterprise'): DataSourceMeta[] {
    const tierHierarchy = { starter: 1, pro: 2, enterprise: 3 };
    const tierLevel = tierHierarchy[tier];

    return DATA_SOURCE_ADAPTERS.filter((a) => {
      const requiredLevel = tierHierarchy[a.requiredTier];
      return requiredLevel <= tierLevel;
    });
  },

  getByTable(table: DataTable): DataSourceMeta[] {
    return DATA_SOURCE_ADAPTERS.filter((a) => a.tables.includes(table));
  },

  has(id: string): boolean {
    return DATA_SOURCE_ADAPTERS.some((a) => a.id === id);
  },

  get count(): number {
    return DATA_SOURCE_ADAPTERS.length;
  },
};
