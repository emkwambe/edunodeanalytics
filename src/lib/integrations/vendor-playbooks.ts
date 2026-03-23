/**
 * Vendor-Specific Integration Playbooks
 * ======================================
 *
 * Not trying to be a deep expert consultant for every platform.
 * These playbooks define:
 * - Common failure modes per vendor
 * - What EduNode can detect
 * - What EduNode can auto-fix
 * - What requires school action
 * - What requires vendor escalation
 *
 * This is scalable support - not unlimited vendor consulting.
 */

import {
  IntegrationErrorCategory,
  ResponsibleParty,
  IssueSeverity,
} from './error-taxonomy';

/**
 * Common failure mode for a vendor
 */
export interface FailureMode {
  /** Unique ID for this failure mode */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this failure looks like */
  description: string;

  /** Error category this maps to */
  errorCategory: IntegrationErrorCategory;

  /** How severe is this issue */
  severity: IssueSeverity;

  /** Who is responsible */
  responsibleParty: ResponsibleParty;

  /** Can EduNode detect this automatically? */
  canDetect: boolean;

  /** Detection method (if canDetect is true) */
  detectionMethod?: string;

  /** Can EduNode auto-fix this? */
  canAutoFix: boolean;

  /** Auto-fix description (if canAutoFix is true) */
  autoFixMethod?: string;

  /** What school admins should do */
  schoolAction: string;

  /** Whether this needs vendor escalation */
  requiresVendorEscalation: boolean;

  /** Escalation template (if requiresVendorEscalation is true) */
  escalationTemplate?: string;

  /** Common root causes */
  commonCauses: string[];

  /** Prevention tips */
  preventionTips: string[];
}

/**
 * Complete playbook for a vendor integration
 */
export interface VendorPlaybook {
  /** Vendor ID (matches data source adapter ID) */
  vendorId: string;

  /** Display name */
  vendorName: string;

  /** Vendor support contact info */
  supportInfo: {
    url: string;
    email?: string;
    phone?: string;
    statusPage?: string;
  };

  /** Common failure modes */
  failureModes: FailureMode[];

  /** General best practices */
  bestPractices: string[];

  /** Known limitations of this integration */
  knownLimitations: string[];

  /** Sync frequency recommendations */
  recommendedSyncFrequency: string;

  /** Typical data latency */
  typicalLatency: string;
}

/**
 * All vendor playbooks
 */
export const VENDOR_PLAYBOOKS: Record<string, VendorPlaybook> = {
  clever: {
    vendorId: 'clever',
    vendorName: 'Clever',
    supportInfo: {
      url: 'https://support.clever.com',
      email: 'schools@clever.com',
      statusPage: 'https://status.clever.com',
    },
    failureModes: [
      {
        id: 'clever_sharing_expired',
        name: 'District Sharing Approval Expired',
        description: 'The district\'s data sharing approval for EduNode has expired and needs renewal.',
        errorCategory: 'authorization_failure',
        severity: 'critical',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'API returns 403 with "sharing not approved" message',
        canAutoFix: false,
        schoolAction: 'Log into Clever district dashboard, go to Data Sharing, find EduNode, and re-approve data sharing.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Annual sharing approval expired',
          'District admin revoked sharing',
          'New district admin unfamiliar with approved apps',
        ],
        preventionTips: [
          'Set calendar reminder 30 days before sharing expiration',
          'Document EduNode in district app inventory',
          'Include in annual IT review checklist',
        ],
      },
      {
        id: 'clever_roster_mismatch',
        name: 'Roster Mismatch',
        description: 'Student records in Clever do not match expected format or contain inconsistencies.',
        errorCategory: 'data_validation_error',
        severity: 'medium',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'Validation rules flag records with missing SIS ID, invalid grade levels, or duplicate entries',
        canAutoFix: false,
        schoolAction: 'Review affected records in SIS. Correct grade levels, ensure unique student IDs, remove duplicate enrollments.',
        requiresVendorEscalation: false,
        commonCauses: [
          'SIS data entry errors',
          'Mid-year student transfers not updated',
          'Bulk import with incorrect mappings',
        ],
        preventionTips: [
          'Run SIS data quality reports monthly',
          'Establish data entry standards',
          'Train staff on proper enrollment procedures',
        ],
      },
      {
        id: 'clever_missing_sections',
        name: 'Missing School Sections',
        description: 'Some class sections are not appearing in Clever sync.',
        errorCategory: 'missing_required_fields',
        severity: 'medium',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'Compare section count with previous sync, alert on >10% decrease',
        canAutoFix: false,
        schoolAction: 'Check SIS section setup. Ensure sections have: valid term dates, assigned teacher, school association.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Sections created without term association',
          'Teacher not assigned to section',
          'Section marked inactive in SIS',
        ],
        preventionTips: [
          'Validate section setup before term starts',
          'Use SIS reports to audit section completeness',
        ],
      },
      {
        id: 'clever_api_change',
        name: 'Clever API Permission Change',
        description: 'Clever has updated their API and permissions required have changed.',
        errorCategory: 'schema_mismatch',
        severity: 'high',
        responsibleParty: 'edunode',
        canDetect: true,
        detectionMethod: 'API returns unexpected field structure or new required scopes',
        canAutoFix: false,
        schoolAction: 'No action required. EduNode will update the integration.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Clever API version update',
          'New data privacy requirements',
          'Deprecated endpoint removal',
        ],
        preventionTips: [
          'EduNode monitors Clever changelog',
          'Updates deployed within 48 hours of API changes',
        ],
      },
      {
        id: 'clever_outage',
        name: 'Clever Service Outage',
        description: 'Clever\'s API is experiencing an outage or maintenance.',
        errorCategory: 'vendor_api_unavailable',
        severity: 'high',
        responsibleParty: 'external_vendor',
        canDetect: true,
        detectionMethod: 'API returns 5xx errors or connection timeouts',
        canAutoFix: true,
        autoFixMethod: 'Automatic retry with exponential backoff (5min, 15min, 1hr, 4hr)',
        schoolAction: 'Check status.clever.com for outage info. No action needed - EduNode will auto-recover.',
        requiresVendorEscalation: true,
        escalationTemplate: `Subject: Clever API Outage Affecting District Sync

District: {{districtName}}
Clever District ID: {{cleverId}}
Issue Started: {{timestamp}}
Impact: Unable to sync student roster data

We are experiencing connectivity issues with the Clever API. Our integration is receiving {{errorCode}} errors when attempting to sync.

Please advise on:
1. Current service status
2. Estimated time to resolution
3. Any required action on our end

Correlation ID: {{correlationId}}`,
        commonCauses: [
          'Scheduled maintenance window',
          'Infrastructure issues at Clever',
          'High load during peak hours',
        ],
        preventionTips: [
          'Monitor status.clever.com',
          'Schedule syncs outside peak hours if possible',
        ],
      },
    ],
    bestPractices: [
      'Sync daily during overnight hours (2-5 AM)',
      'Review data sharing settings annually',
      'Keep SIS roster data clean and up-to-date',
      'Monitor sync status dashboard weekly',
    ],
    knownLimitations: [
      'Historical grade data limited to current term',
      'Student photos not included in basic tier',
      'Real-time webhooks require Clever Secure Sync',
    ],
    recommendedSyncFrequency: 'Daily',
    typicalLatency: '15-30 minutes',
  },

  classlink: {
    vendorId: 'classlink',
    vendorName: 'ClassLink',
    supportInfo: {
      url: 'https://www.classlink.com/support',
      email: 'support@classlink.com',
      statusPage: 'https://status.classlink.com',
    },
    failureModes: [
      {
        id: 'classlink_token_expired',
        name: 'OAuth Token Expired',
        description: 'The ClassLink OAuth token has expired and needs to be refreshed.',
        errorCategory: 'authentication_failure',
        severity: 'critical',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'API returns 401 Unauthorized with token expiry message',
        canAutoFix: true,
        autoFixMethod: 'Attempt refresh token flow automatically',
        schoolAction: 'If auto-refresh fails, re-authorize EduNode in ClassLink admin console.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Refresh token also expired (90 days)',
          'Admin revoked app authorization',
          'Password change invalidated tokens',
        ],
        preventionTips: [
          'EduNode refreshes tokens automatically',
          'Notify IT before changing admin passwords',
        ],
      },
      {
        id: 'classlink_roster_filter',
        name: 'Roster Filter Misconfigured',
        description: 'ClassLink roster filter is excluding students that should be synced.',
        errorCategory: 'district_config_issue',
        severity: 'medium',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'Student count significantly lower than expected, or specific grades missing',
        canAutoFix: false,
        schoolAction: 'Review ClassLink roster filter settings. Ensure all desired grade levels and schools are included.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Filter set to specific schools only',
          'Grade level filter too restrictive',
          'Active student flag misconfigured',
        ],
        preventionTips: [
          'Document roster filter settings',
          'Review filters when adding new schools',
        ],
      },
      {
        id: 'classlink_oneroster_version',
        name: 'OneRoster Version Mismatch',
        description: 'ClassLink OneRoster API version differs from expected.',
        errorCategory: 'schema_mismatch',
        severity: 'high',
        responsibleParty: 'edunode',
        canDetect: true,
        detectionMethod: 'API response schema validation fails',
        canAutoFix: false,
        schoolAction: 'No action required. EduNode will update the integration.',
        requiresVendorEscalation: false,
        commonCauses: [
          'District upgraded to OneRoster 1.2',
          'ClassLink platform update',
        ],
        preventionTips: [
          'EduNode supports OneRoster 1.1 and 1.2',
          'Contact support if using custom OneRoster implementation',
        ],
      },
    ],
    bestPractices: [
      'Use OneRoster API for most reliable data',
      'Configure roster filters to match EduNode needs',
      'Review app permissions annually',
    ],
    knownLimitations: [
      'Some districts use legacy LaunchPad API',
      'Custom fields may not sync automatically',
    ],
    recommendedSyncFrequency: 'Daily',
    typicalLatency: '10-20 minutes',
  },

  powerschool: {
    vendorId: 'powerschool',
    vendorName: 'PowerSchool',
    supportInfo: {
      url: 'https://help.powerschool.com',
      email: 'support@powerschool.com',
      phone: '1-877-873-1550',
      statusPage: 'https://status.powerschool.com',
    },
    failureModes: [
      {
        id: 'ps_plugin_disabled',
        name: 'PowerSchool Plugin Disabled',
        description: 'The EduNode plugin in PowerSchool has been disabled.',
        errorCategory: 'authorization_failure',
        severity: 'critical',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'API returns 403 or plugin endpoint not found',
        canAutoFix: false,
        schoolAction: 'Log into PowerSchool Admin > Plugin Management. Enable the EduNode plugin.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Plugin disabled during maintenance',
          'PowerSchool upgrade reset plugin state',
          'Admin disabled unfamiliar plugins',
        ],
        preventionTips: [
          'Document enabled plugins in IT runbook',
          'Check plugin status after PowerSchool upgrades',
        ],
      },
      {
        id: 'ps_api_credentials',
        name: 'API Credentials Invalid',
        description: 'PowerSchool API credentials (client ID/secret) are invalid.',
        errorCategory: 'authentication_failure',
        severity: 'critical',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'OAuth token request fails with invalid_client',
        canAutoFix: false,
        schoolAction: 'Generate new API credentials in PowerSchool Admin > Plugin Management > EduNode > Credentials.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Credentials rotated by admin',
          'Plugin reinstalled with new credentials',
          'Test vs production credential mismatch',
        ],
        preventionTips: [
          'Store credentials in secure password manager',
          'Update EduNode immediately when rotating credentials',
        ],
      },
      {
        id: 'ps_custom_fields',
        name: 'Custom Field Not Found',
        description: 'A custom field referenced in the mapping does not exist in PowerSchool.',
        errorCategory: 'mapping_error',
        severity: 'medium',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'API returns field not found error for specific DCID',
        canAutoFix: false,
        schoolAction: 'Verify custom field exists in PowerSchool. Update field mapping in EduNode if field was renamed.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Custom field renamed or deleted',
          'Field exists in test but not production',
          'Field permission restricted',
        ],
        preventionTips: [
          'Document custom fields used by integrations',
          'Test mappings after PowerSchool schema changes',
        ],
      },
      {
        id: 'ps_large_district_timeout',
        name: 'Large District Timeout',
        description: 'Sync times out for large districts with many students.',
        errorCategory: 'network_timeout',
        severity: 'medium',
        responsibleParty: 'edunode',
        canDetect: true,
        detectionMethod: 'Sync exceeds 30 minute timeout threshold',
        canAutoFix: true,
        autoFixMethod: 'Automatically switch to paginated/incremental sync mode',
        schoolAction: 'No action required. EduNode will optimize the sync strategy.',
        requiresVendorEscalation: false,
        commonCauses: [
          'District has >50,000 students',
          'Full sync requested instead of incremental',
          'Network congestion',
        ],
        preventionTips: [
          'Use incremental syncs for large districts',
          'Schedule full syncs during off-peak hours',
        ],
      },
    ],
    bestPractices: [
      'Install official EduNode plugin from PowerSchool Marketplace',
      'Use service account with minimal required permissions',
      'Schedule syncs during PowerSchool low-usage hours',
      'Test in sandbox before production',
    ],
    knownLimitations: [
      'Historical data limited to current and previous year',
      'Some custom page fields require additional plugin permissions',
      'PowerSchool SIS and PowerSchool Enrollment are separate integrations',
    ],
    recommendedSyncFrequency: 'Daily (incremental) + Weekly (full)',
    typicalLatency: '20-45 minutes',
  },

  canvas: {
    vendorId: 'canvas',
    vendorName: 'Canvas LMS',
    supportInfo: {
      url: 'https://community.canvaslms.com',
      statusPage: 'https://status.instructure.com',
    },
    failureModes: [
      {
        id: 'canvas_token_scopes',
        name: 'Insufficient Token Scopes',
        description: 'The Canvas API token does not have required scopes.',
        errorCategory: 'authorization_failure',
        severity: 'critical',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'API returns 403 with insufficient_scope error',
        canAutoFix: false,
        schoolAction: 'Generate new API token in Canvas with these scopes: read courses, read enrollments, read grades, read users.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Token generated before new scopes added',
          'Canvas admin restricted available scopes',
          'Using personal token instead of admin token',
        ],
        preventionTips: [
          'Use dedicated service account for integrations',
          'Document required scopes in IT runbook',
        ],
      },
      {
        id: 'canvas_rate_limit',
        name: 'Canvas Rate Limit',
        description: 'Canvas API rate limit exceeded (700 requests/10 minutes).',
        errorCategory: 'rate_limit_exceeded',
        severity: 'medium',
        responsibleParty: 'edunode',
        canDetect: true,
        detectionMethod: 'API returns 403 with X-Rate-Limit-Remaining: 0',
        canAutoFix: true,
        autoFixMethod: 'Pause sync, wait for rate limit reset, resume with throttling',
        schoolAction: 'No action required. EduNode automatically manages rate limits.',
        requiresVendorEscalation: false,
        commonCauses: [
          'Multiple integrations using same token',
          'Large course sync during peak hours',
          'Full sync instead of incremental',
        ],
        preventionTips: [
          'Use dedicated token for EduNode',
          'Schedule syncs during off-peak hours',
        ],
      },
      {
        id: 'canvas_sis_import_error',
        name: 'SIS Import Conflict',
        description: 'Canvas SIS import is conflicting with EduNode sync.',
        errorCategory: 'duplicate_record',
        severity: 'low',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'Records have SIS import lock preventing updates',
        canAutoFix: false,
        schoolAction: 'Coordinate sync schedules. EduNode should sync after SIS import completes.',
        requiresVendorEscalation: false,
        commonCauses: [
          'SIS import and EduNode sync overlap',
          'SIS import locked records for editing',
        ],
        preventionTips: [
          'Schedule EduNode sync 2+ hours after SIS import',
          'Use Canvas enrollment API instead of direct updates',
        ],
      },
    ],
    bestPractices: [
      'Generate admin-level API token with specific scopes',
      'Sync grades after assignment due dates, not during',
      'Use incremental sync to respect rate limits',
    ],
    knownLimitations: [
      'Canvas Free for Teachers has API restrictions',
      'Some custom gradebook settings may affect grade export',
      'Blueprint courses sync differently',
    ],
    recommendedSyncFrequency: 'Hourly (grades) + Daily (roster)',
    typicalLatency: '5-15 minutes',
  },

  nwea_map: {
    vendorId: 'nwea_map',
    vendorName: 'NWEA MAP',
    supportInfo: {
      url: 'https://www.nwea.org/support',
      email: 'support@nwea.org',
      phone: '1-866-654-3246',
    },
    failureModes: [
      {
        id: 'nwea_sftp_auth',
        name: 'SFTP Authentication Failed',
        description: 'Cannot connect to NWEA SFTP server with provided credentials.',
        errorCategory: 'authentication_failure',
        severity: 'critical',
        responsibleParty: 'school_district',
        canDetect: true,
        detectionMethod: 'SFTP connection returns authentication error',
        canAutoFix: false,
        schoolAction: 'Verify SFTP credentials in NWEA admin portal. Regenerate if necessary.',
        requiresVendorEscalation: false,
        commonCauses: [
          'SFTP password expired (90-day policy)',
          'IP whitelist not configured',
          'Wrong SFTP endpoint (test vs production)',
        ],
        preventionTips: [
          'Set reminder for SFTP password rotation',
          'Whitelist EduNode IP range in NWEA',
        ],
      },
      {
        id: 'nwea_no_data',
        name: 'No Assessment Data Available',
        description: 'SFTP folder is empty or contains no new data files.',
        errorCategory: 'missing_required_fields',
        severity: 'low',
        responsibleParty: 'external_vendor',
        canDetect: true,
        detectionMethod: 'SFTP directory listing returns zero matching files',
        canAutoFix: false,
        schoolAction: 'Verify testing window has closed. Data exports 24-48 hours after testing.',
        requiresVendorEscalation: true,
        escalationTemplate: `Subject: Missing MAP Assessment Data Export

District: {{districtName}}
NWEA Customer ID: {{nweaId}}
Expected Export Date: {{expectedDate}}

We are not seeing the expected assessment data files in our SFTP folder.
Testing window closed on: {{testingEndDate}}

Please confirm:
1. Data export is scheduled/completed
2. Files are in correct SFTP location
3. No processing errors occurred

Correlation ID: {{correlationId}}`,
        commonCauses: [
          'Testing window still open',
          'Data processing delay at NWEA',
          'Files in wrong SFTP folder',
        ],
        preventionTips: [
          'Confirm testing window dates with assessment coordinator',
          'Allow 48 hours after testing closes',
        ],
      },
    ],
    bestPractices: [
      'Configure SFTP export schedule in NWEA admin',
      'Sync 48 hours after testing window closes',
      'Verify student IDs match between SIS and NWEA',
    ],
    knownLimitations: [
      'Real-time API not available for all districts',
      'Historical data limited by NWEA retention policy',
      'Skill strand data may require separate export',
    ],
    recommendedSyncFrequency: 'After testing windows (manual trigger)',
    typicalLatency: '24-48 hours after testing',
  },
};

/**
 * Get playbook for a vendor
 */
export function getPlaybook(vendorId: string): VendorPlaybook | undefined {
  return VENDOR_PLAYBOOKS[vendorId];
}

/**
 * Get all playbooks
 */
export function getAllPlaybooks(): VendorPlaybook[] {
  return Object.values(VENDOR_PLAYBOOKS);
}

/**
 * Find matching failure mode for an error
 */
export function matchFailureMode(
  vendorId: string,
  errorCategory: IntegrationErrorCategory,
  errorMessage?: string
): FailureMode | undefined {
  const playbook = VENDOR_PLAYBOOKS[vendorId];
  if (!playbook) return undefined;

  // First try to match by error category
  const categoryMatches = playbook.failureModes.filter(
    (fm) => fm.errorCategory === errorCategory
  );

  if (categoryMatches.length === 1) {
    return categoryMatches[0];
  }

  // If multiple matches, try to narrow down by error message
  if (errorMessage && categoryMatches.length > 1) {
    const messageMatch = categoryMatches.find((fm) =>
      fm.description.toLowerCase().includes(errorMessage.toLowerCase()) ||
      fm.commonCauses.some((cause) =>
        cause.toLowerCase().includes(errorMessage.toLowerCase())
      )
    );
    if (messageMatch) return messageMatch;
  }

  // Return first category match or undefined
  return categoryMatches[0];
}

/**
 * Generate escalation message from template
 */
export function generateEscalationMessage(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
