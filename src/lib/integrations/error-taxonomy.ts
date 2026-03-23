/**
 * Integration Error Taxonomy & Ownership Classification
 * ======================================================
 *
 * Strategic positioning: EduNode is the integration governance layer,
 * NOT the full outsourced support desk for every school system vendor.
 *
 * This module provides:
 * 1. Error categorization for all integration failures
 * 2. Ownership classification (who is responsible for the fix)
 * 3. Recommended actions based on error type
 * 4. Escalation paths for vendor-owned issues
 */

/**
 * Error categories for integration failures
 * Used to quickly identify what type of problem occurred
 */
export type IntegrationErrorCategory =
  | 'authentication_failure'      // Token expired, invalid credentials
  | 'authorization_failure'       // Permission/scope denied
  | 'vendor_api_unavailable'      // Vendor outage or maintenance
  | 'rate_limit_exceeded'         // Too many requests
  | 'invalid_payload'             // Malformed data from vendor
  | 'schema_mismatch'             // Unexpected data structure
  | 'mapping_error'               // Field mapping configuration issue
  | 'duplicate_record'            // Conflict with existing data
  | 'missing_required_fields'     // Required data not provided by source
  | 'district_config_issue'       // School/district misconfiguration
  | 'edunode_internal_error'      // Our platform bug
  | 'network_timeout'             // Connection timeout
  | 'data_validation_error'       // Data failed validation rules
  | 'quota_exceeded'              // API quota or storage limit
  | 'unknown';                    // Unclassified error

/**
 * Who is responsible for resolving this issue
 */
export type ResponsibleParty =
  | 'edunode'           // EduNode platform team owns the fix
  | 'school_district'   // School/district admin action required
  | 'external_vendor';  // Third-party vendor must resolve

/**
 * Severity levels for integration issues
 */
export type IssueSeverity =
  | 'critical'    // Data sync completely blocked
  | 'high'        // Significant data loss or delay
  | 'medium'      // Partial sync issues
  | 'low';        // Minor issues, workaround available

/**
 * Overall health status for a connector
 */
export type ConnectorHealthStatus =
  | 'healthy'     // All syncs successful
  | 'degraded'    // Partial issues, some data flowing
  | 'failed'      // Sync blocked
  | 'paused';     // Manually paused by admin

/**
 * Detailed integration error with classification
 */
export interface ClassifiedIntegrationError {
  /** Unique error ID for tracking */
  errorId: string;

  /** When the error occurred */
  timestamp: Date;

  /** Error category from taxonomy */
  category: IntegrationErrorCategory;

  /** Who needs to fix this */
  responsibleParty: ResponsibleParty;

  /** How severe is the impact */
  severity: IssueSeverity;

  /** Human-readable error message */
  message: string;

  /** Technical details for debugging */
  technicalDetails?: string;

  /** Original error code from vendor (if applicable) */
  vendorErrorCode?: string;

  /** Affected records count */
  affectedRecords?: number;

  /** Correlation ID for tracing */
  correlationId: string;

  /** Recommended action for resolution */
  recommendedAction: RecommendedAction;

  /** Whether this error is auto-recoverable */
  isAutoRecoverable: boolean;

  /** If auto-recoverable, when will retry happen */
  nextRetryAt?: Date;
}

/**
 * Recommended action for resolving an issue
 */
export interface RecommendedAction {
  /** Short title for the action */
  title: string;

  /** Detailed description of what to do */
  description: string;

  /** Step-by-step instructions */
  steps: string[];

  /** Who should take this action */
  actor: ResponsibleParty;

  /** Estimated time to resolve */
  estimatedResolutionTime?: string;

  /** Link to documentation (if available) */
  documentationUrl?: string;

  /** Whether escalation is recommended */
  requiresEscalation: boolean;

  /** Escalation contact info (if applicable) */
  escalationInfo?: {
    vendor: string;
    supportUrl?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
}

/**
 * Error category metadata
 */
export const ERROR_CATEGORY_META: Record<IntegrationErrorCategory, {
  label: string;
  description: string;
  defaultResponsibleParty: ResponsibleParty;
  defaultSeverity: IssueSeverity;
  isAutoRecoverable: boolean;
}> = {
  authentication_failure: {
    label: 'Authentication Failure',
    description: 'Credentials invalid or token expired',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'critical',
    isAutoRecoverable: false,
  },
  authorization_failure: {
    label: 'Authorization/Scope Failure',
    description: 'Permission denied or insufficient scopes',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'critical',
    isAutoRecoverable: false,
  },
  vendor_api_unavailable: {
    label: 'Vendor API Unavailable',
    description: 'Third-party service is down or unreachable',
    defaultResponsibleParty: 'external_vendor',
    defaultSeverity: 'high',
    isAutoRecoverable: true,
  },
  rate_limit_exceeded: {
    label: 'Rate Limit Exceeded',
    description: 'Too many API requests in time window',
    defaultResponsibleParty: 'edunode',
    defaultSeverity: 'medium',
    isAutoRecoverable: true,
  },
  invalid_payload: {
    label: 'Invalid Payload',
    description: 'Malformed or unexpected data received',
    defaultResponsibleParty: 'external_vendor',
    defaultSeverity: 'medium',
    isAutoRecoverable: false,
  },
  schema_mismatch: {
    label: 'Schema Mismatch',
    description: 'Data structure does not match expected format',
    defaultResponsibleParty: 'edunode',
    defaultSeverity: 'high',
    isAutoRecoverable: false,
  },
  mapping_error: {
    label: 'Mapping Error',
    description: 'Field mapping configuration is incorrect',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'medium',
    isAutoRecoverable: false,
  },
  duplicate_record: {
    label: 'Duplicate Record Conflict',
    description: 'Record already exists with same identifier',
    defaultResponsibleParty: 'edunode',
    defaultSeverity: 'low',
    isAutoRecoverable: true,
  },
  missing_required_fields: {
    label: 'Missing Required Fields',
    description: 'Source data missing required information',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'medium',
    isAutoRecoverable: false,
  },
  district_config_issue: {
    label: 'District Configuration Issue',
    description: 'School/district settings need correction',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'medium',
    isAutoRecoverable: false,
  },
  edunode_internal_error: {
    label: 'EduNode Internal Error',
    description: 'Platform processing error',
    defaultResponsibleParty: 'edunode',
    defaultSeverity: 'high',
    isAutoRecoverable: false,
  },
  network_timeout: {
    label: 'Network Timeout',
    description: 'Connection timed out during sync',
    defaultResponsibleParty: 'edunode',
    defaultSeverity: 'medium',
    isAutoRecoverable: true,
  },
  data_validation_error: {
    label: 'Data Validation Error',
    description: 'Data failed validation rules',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'medium',
    isAutoRecoverable: false,
  },
  quota_exceeded: {
    label: 'Quota Exceeded',
    description: 'API or storage quota limit reached',
    defaultResponsibleParty: 'school_district',
    defaultSeverity: 'high',
    isAutoRecoverable: false,
  },
  unknown: {
    label: 'Unknown Error',
    description: 'Unclassified integration error',
    defaultResponsibleParty: 'edunode',
    defaultSeverity: 'medium',
    isAutoRecoverable: false,
  },
};

/**
 * Responsible party metadata
 */
export const RESPONSIBLE_PARTY_META: Record<ResponsibleParty, {
  label: string;
  description: string;
  color: string;
}> = {
  edunode: {
    label: 'EduNode',
    description: 'EduNode platform team will investigate and resolve',
    color: 'violet',
  },
  school_district: {
    label: 'School/District',
    description: 'School administrator action required',
    color: 'amber',
  },
  external_vendor: {
    label: 'External Vendor',
    description: 'Third-party vendor must resolve this issue',
    color: 'rose',
  },
};

/**
 * Generate a recommended action based on error category
 */
export function getRecommendedAction(
  category: IntegrationErrorCategory,
  vendorName: string,
  context?: {
    affectedRecords?: number;
    lastSuccessfulSync?: Date;
    vendorErrorCode?: string;
  }
): RecommendedAction {
  const meta = ERROR_CATEGORY_META[category];

  switch (category) {
    case 'authentication_failure':
      return {
        title: 'Re-authenticate Connection',
        description: `Your ${vendorName} credentials have expired or are invalid. You need to re-authenticate the connection.`,
        steps: [
          `Go to Settings > Data Sources > ${vendorName}`,
          'Click "Reconnect" or "Re-authenticate"',
          'Follow the OAuth flow or enter new credentials',
          'Verify the connection status shows "Connected"',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '5-10 minutes',
        requiresEscalation: false,
      };

    case 'authorization_failure':
      return {
        title: 'Update API Permissions',
        description: `${vendorName} is blocking access due to insufficient permissions. The required scopes may have changed.`,
        steps: [
          `Log into your ${vendorName} admin portal`,
          'Navigate to API/Integration settings',
          'Verify EduNode has the required permissions/scopes',
          'If permissions were revoked, re-authorize EduNode',
          'Return to EduNode and reconnect',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '10-15 minutes',
        requiresEscalation: false,
      };

    case 'vendor_api_unavailable':
      return {
        title: 'Wait for Vendor Recovery',
        description: `${vendorName}'s API is currently unavailable. This is a vendor-side issue that EduNode cannot resolve.`,
        steps: [
          `Check ${vendorName}'s status page for outage information`,
          'EduNode will automatically retry when service recovers',
          'If outage persists beyond 4 hours, contact vendor support',
        ],
        actor: 'external_vendor',
        estimatedResolutionTime: 'Depends on vendor',
        requiresEscalation: true,
        escalationInfo: {
          vendor: vendorName,
          supportUrl: getVendorSupportUrl(vendorName),
        },
      };

    case 'rate_limit_exceeded':
      return {
        title: 'Automatic Retry Scheduled',
        description: `${vendorName} rate limit reached. EduNode will automatically retry with backoff.`,
        steps: [
          'No action required - automatic retry in progress',
          'If this happens frequently, consider adjusting sync frequency',
          'Contact EduNode support if rate limits persist',
        ],
        actor: 'edunode',
        estimatedResolutionTime: '15-60 minutes',
        requiresEscalation: false,
      };

    case 'invalid_payload':
      return {
        title: 'Report Data Quality Issue',
        description: `${vendorName} sent malformed data that could not be processed.`,
        steps: [
          'Review the affected records in the error details',
          `Check if the data exists correctly in ${vendorName}`,
          'If data looks correct in source, escalate to vendor',
          'Provide the correlation ID when contacting support',
        ],
        actor: 'external_vendor',
        estimatedResolutionTime: '1-2 business days',
        requiresEscalation: true,
        escalationInfo: {
          vendor: vendorName,
          supportUrl: getVendorSupportUrl(vendorName),
        },
      };

    case 'schema_mismatch':
      return {
        title: 'Schema Update Required',
        description: `${vendorName}'s data format has changed. EduNode needs to update the integration.`,
        steps: [
          'No action required from your end',
          'EduNode engineering has been notified',
          'We will update the integration within 24-48 hours',
        ],
        actor: 'edunode',
        estimatedResolutionTime: '24-48 hours',
        requiresEscalation: false,
      };

    case 'mapping_error':
      return {
        title: 'Review Field Mappings',
        description: 'Some fields are not mapped correctly between your source system and EduNode.',
        steps: [
          'Go to Settings > Data Sources > Schema Mapping',
          'Review the field mappings for errors (marked in red)',
          'Correct any invalid or missing mappings',
          'Save and trigger a new sync',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '10-20 minutes',
        requiresEscalation: false,
      };

    case 'duplicate_record':
      return {
        title: 'Automatic Deduplication',
        description: 'Duplicate records detected. EduNode will handle this automatically.',
        steps: [
          'No action required - duplicates are being resolved',
          'If duplicates persist, check for duplicate IDs in source system',
        ],
        actor: 'edunode',
        estimatedResolutionTime: 'Automatic',
        requiresEscalation: false,
      };

    case 'missing_required_fields':
      return {
        title: 'Complete Source Data',
        description: `Some records in ${vendorName} are missing required fields and could not be synced.`,
        steps: [
          'Review the list of affected records below',
          `Update these records in ${vendorName} with the missing fields`,
          'Required fields: Student ID, Name, Grade Level, Enrollment Status',
          'Trigger a manual sync after updating',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '30-60 minutes',
        requiresEscalation: false,
      };

    case 'district_config_issue':
      return {
        title: 'Update District Configuration',
        description: 'Your district settings need to be corrected for the integration to work properly.',
        steps: [
          'Go to Settings > School Profile',
          'Verify your district ID and school IDs are correct',
          'Check that your subscription tier includes this integration',
          'Contact your district IT admin if IDs need updating',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '15-30 minutes',
        requiresEscalation: false,
      };

    case 'edunode_internal_error':
      return {
        title: 'EduNode Engineering Notified',
        description: 'An internal error occurred. Our engineering team has been automatically notified.',
        steps: [
          'No action required from your end',
          'EduNode engineering is investigating',
          'You will be notified when the issue is resolved',
          'If urgent, contact support@edunode.io',
        ],
        actor: 'edunode',
        estimatedResolutionTime: '2-24 hours',
        requiresEscalation: false,
      };

    case 'network_timeout':
      return {
        title: 'Automatic Retry in Progress',
        description: 'Network connection timed out. EduNode will retry automatically.',
        steps: [
          'No action required - automatic retry scheduled',
          'If timeouts persist, check your network/firewall settings',
          `Ensure ${vendorName} IPs are whitelisted if required`,
        ],
        actor: 'edunode',
        estimatedResolutionTime: '5-15 minutes',
        requiresEscalation: false,
      };

    case 'data_validation_error':
      return {
        title: 'Fix Data Quality Issues',
        description: 'Some records failed validation and could not be imported.',
        steps: [
          'Review the affected records and validation errors',
          'Common issues: invalid dates, out-of-range grades, malformed IDs',
          'Correct the data in your source system',
          'Trigger a manual sync to retry',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '30-60 minutes',
        requiresEscalation: false,
      };

    case 'quota_exceeded':
      return {
        title: 'Review API Quota',
        description: `Your ${vendorName} API quota has been exceeded.`,
        steps: [
          `Check your ${vendorName} API usage dashboard`,
          'Consider upgrading your API plan if available',
          'Reduce sync frequency if quota is limited',
          'Contact vendor to request quota increase',
        ],
        actor: 'school_district',
        estimatedResolutionTime: '1-2 business days',
        requiresEscalation: true,
        escalationInfo: {
          vendor: vendorName,
          supportUrl: getVendorSupportUrl(vendorName),
        },
      };

    default:
      return {
        title: 'Contact Support',
        description: 'An unclassified error occurred. Please contact EduNode support.',
        steps: [
          'Note the error details and correlation ID',
          'Contact support@edunode.io',
          'Include the correlation ID in your message',
        ],
        actor: 'edunode',
        estimatedResolutionTime: 'Varies',
        requiresEscalation: false,
      };
  }
}

/**
 * Get vendor support URL
 */
function getVendorSupportUrl(vendorName: string): string {
  const urls: Record<string, string> = {
    'Clever': 'https://support.clever.com',
    'ClassLink': 'https://www.classlink.com/support',
    'PowerSchool': 'https://help.powerschool.com',
    'Canvas': 'https://community.canvaslms.com/t5/Canvas/ct-p/canvas',
    'Google Classroom': 'https://support.google.com/edu/classroom',
    'Schoology': 'https://support.schoology.com',
    'Infinite Campus': 'https://kb.infinitecampus.com',
    'NWEA MAP': 'https://www.nwea.org/support',
    'iReady': 'https://www.curriculumassociates.com/support',
    'Renaissance STAR': 'https://help.renaissance.com',
  };
  return urls[vendorName] || 'https://support.edunode.io';
}

/**
 * Classify an error from raw error data
 */
export function classifyError(
  error: Error | { code?: string; message: string; status?: number },
  vendorName: string,
  context?: {
    endpoint?: string;
    httpStatus?: number;
    vendorErrorCode?: string;
  }
): { category: IntegrationErrorCategory; responsibleParty: ResponsibleParty; severity: IssueSeverity } {
  const message = error.message.toLowerCase();
  const status = context?.httpStatus || (error as { status?: number }).status;
  const code = context?.vendorErrorCode || (error as { code?: string }).code;

  // Authentication errors
  if (status === 401 || message.includes('unauthorized') || message.includes('invalid token') ||
      message.includes('expired') || code === 'AUTH_FAILED') {
    return { category: 'authentication_failure', responsibleParty: 'school_district', severity: 'critical' };
  }

  // Authorization errors
  if (status === 403 || message.includes('forbidden') || message.includes('permission denied') ||
      message.includes('scope') || code === 'FORBIDDEN') {
    return { category: 'authorization_failure', responsibleParty: 'school_district', severity: 'critical' };
  }

  // Vendor unavailable
  if (status === 503 || status === 502 || status === 504 || message.includes('service unavailable') ||
      message.includes('maintenance') || message.includes('down')) {
    return { category: 'vendor_api_unavailable', responsibleParty: 'external_vendor', severity: 'high' };
  }

  // Rate limiting
  if (status === 429 || message.includes('rate limit') || message.includes('too many requests') ||
      code === 'RATE_LIMITED') {
    return { category: 'rate_limit_exceeded', responsibleParty: 'edunode', severity: 'medium' };
  }

  // Invalid payload
  if (status === 400 && (message.includes('invalid') || message.includes('malformed'))) {
    return { category: 'invalid_payload', responsibleParty: 'external_vendor', severity: 'medium' };
  }

  // Network timeout
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
    return { category: 'network_timeout', responsibleParty: 'edunode', severity: 'medium' };
  }

  // Duplicate record
  if (status === 409 || message.includes('duplicate') || message.includes('already exists')) {
    return { category: 'duplicate_record', responsibleParty: 'edunode', severity: 'low' };
  }

  // Missing fields
  if (message.includes('required') || message.includes('missing field')) {
    return { category: 'missing_required_fields', responsibleParty: 'school_district', severity: 'medium' };
  }

  // Default to unknown
  return { category: 'unknown', responsibleParty: 'edunode', severity: 'medium' };
}

/**
 * Generate a unique correlation ID for error tracking
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}
