/**
 * PII Anonymization Utility
 *
 * Provides data anonymization and pseudonymization for FERPA/COPPA compliance
 * when transmitting student data to third-party services (AI APIs, webhooks, exports).
 *
 * Key principles:
 * 1. Real PII never leaves the system boundary
 * 2. Reversible mappings stored locally for re-identification when needed
 * 3. Consistent pseudonyms within a session for data coherence
 * 4. Configurable anonymization levels based on use case
 */

import crypto from 'crypto';

// Types for student data
export interface StudentPII {
  id: string;
  student_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  phone?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  ssn?: string;
  [key: string]: unknown;
}

export interface AnonymizedStudent {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  // Non-PII fields pass through unchanged
  [key: string]: unknown;
}

export interface AnonymizationMapping {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  mappings: Map<string, string>; // original -> anonymized
  reverseMappings: Map<string, string>; // anonymized -> original
}

// Anonymization levels
export type AnonymizationLevel =
  | 'full'      // Complete anonymization - no reversible mapping
  | 'pseudonym' // Pseudonymization with reversible local mapping
  | 'partial'   // Only sensitive fields (names, emails) anonymized
  | 'aggregate' // Data aggregated, no individual records
  | 'none';     // No anonymization (internal use only)

// Configuration for what fields to anonymize
export interface AnonymizationConfig {
  level: AnonymizationLevel;
  // Fields that contain direct identifiers (always anonymized)
  directIdentifiers: string[];
  // Fields that contain quasi-identifiers (conditionally anonymized)
  quasiIdentifiers: string[];
  // Fields to completely remove
  removeFields: string[];
  // Whether to preserve data utility for analytics
  preserveAnalytics: boolean;
  // Session duration for mapping persistence (in minutes)
  mappingTTL: number;
}

// Default configuration
export const DEFAULT_ANONYMIZATION_CONFIG: AnonymizationConfig = {
  level: 'pseudonym',
  directIdentifiers: [
    'first_name',
    'last_name',
    'email',
    'student_id',
    'parent_name',
    'parent_email',
    'parent_phone',
    'phone',
    'address',
    'ssn',
  ],
  quasiIdentifiers: [
    'date_of_birth',
    'zip_code',
    'ethnicity',
    'gender',
  ],
  removeFields: [
    'ssn',
    'social_security',
    'password',
    'password_hash',
  ],
  preserveAnalytics: true,
  mappingTTL: 60, // 1 hour
};

// Predefined name pools for consistent, realistic pseudonyms
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Parker', 'Sage', 'River', 'Phoenix', 'Skyler', 'Dakota', 'Reese', 'Jamie',
  'Drew', 'Blair', 'Lane', 'Emerson', 'Finley', 'Hayden', 'Kendall', 'Logan',
  'Peyton', 'Rowan', 'Sawyer', 'Spencer', 'Sydney', 'Tatum',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
];

/**
 * PII Anonymizer Class
 * Handles data anonymization with session-based reversible mappings
 */
export class PIIAnonymizer {
  private config: AnonymizationConfig;
  private sessionMappings: Map<string, AnonymizationMapping> = new Map();
  private schoolSecret: string;

  constructor(schoolId: string, config?: Partial<AnonymizationConfig>) {
    this.config = { ...DEFAULT_ANONYMIZATION_CONFIG, ...config };
    // School-specific secret for consistent hashing within a school
    this.schoolSecret = this.generateSchoolSecret(schoolId);
  }

  /**
   * Generate a deterministic secret for a school (consistent pseudonyms)
   */
  private generateSchoolSecret(schoolId: string): string {
    const baseSecret = process.env.ANONYMIZATION_SECRET || 'edunode-default-secret';
    return crypto
      .createHmac('sha256', baseSecret)
      .update(schoolId)
      .digest('hex');
  }

  /**
   * Create or retrieve a session for mapping persistence
   */
  getOrCreateSession(sessionId?: string): AnonymizationMapping {
    const id = sessionId || crypto.randomUUID();

    if (this.sessionMappings.has(id)) {
      const session = this.sessionMappings.get(id)!;
      // Check if session is expired
      if (session.expiresAt > new Date()) {
        return session;
      }
      // Clean up expired session
      this.sessionMappings.delete(id);
    }

    const session: AnonymizationMapping = {
      sessionId: id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.mappingTTL * 60 * 1000),
      mappings: new Map(),
      reverseMappings: new Map(),
    };

    this.sessionMappings.set(id, session);
    return session;
  }

  /**
   * Generate a consistent pseudonym for a value
   */
  private generatePseudonym(
    originalValue: string,
    fieldType: 'name' | 'email' | 'id' | 'other',
    session: AnonymizationMapping
  ): string {
    // Check if we already have a mapping
    const cacheKey = `${fieldType}:${originalValue}`;
    if (session.mappings.has(cacheKey)) {
      return session.mappings.get(cacheKey)!;
    }

    let pseudonym: string;

    switch (fieldType) {
      case 'name':
        // Use hash to pick consistent name from pool
        const nameHash = crypto
          .createHmac('sha256', this.schoolSecret)
          .update(originalValue)
          .digest('hex');
        const nameIndex = parseInt(nameHash.substring(0, 8), 16);

        // Determine if first or last name based on field
        if (originalValue.includes('@') || originalValue.length > 15) {
          pseudonym = LAST_NAMES[nameIndex % LAST_NAMES.length];
        } else {
          pseudonym = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
        }
        break;

      case 'email':
        // Generate fake email
        const emailHash = crypto
          .createHmac('sha256', this.schoolSecret)
          .update(originalValue)
          .digest('hex')
          .substring(0, 8);
        pseudonym = `student_${emailHash}@example.edu`;
        break;

      case 'id':
        // Generate consistent but non-reversible ID
        const idHash = crypto
          .createHmac('sha256', this.schoolSecret)
          .update(originalValue)
          .digest('hex')
          .substring(0, 12)
          .toUpperCase();
        pseudonym = `STU_${idHash}`;
        break;

      default:
        // Generic hash-based pseudonym
        pseudonym = crypto
          .createHmac('sha256', this.schoolSecret)
          .update(originalValue)
          .digest('hex')
          .substring(0, 16);
    }

    // Store bidirectional mapping
    session.mappings.set(cacheKey, pseudonym);
    session.reverseMappings.set(`${fieldType}:${pseudonym}`, originalValue);

    return pseudonym;
  }

  /**
   * Anonymize a single student record
   */
  anonymizeStudent(
    student: StudentPII,
    sessionId?: string
  ): AnonymizedStudent {
    const session = this.getOrCreateSession(sessionId);
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(student)) {
      // Skip fields that should be removed
      if (this.config.removeFields.includes(key)) {
        continue;
      }

      // Handle null/undefined values
      if (value === null || value === undefined) {
        result[key] = value;
        continue;
      }

      // Check if this is a direct identifier
      if (this.config.directIdentifiers.includes(key)) {
        const stringValue = String(value);

        // Determine field type for appropriate pseudonym generation
        let fieldType: 'name' | 'email' | 'id' | 'other' = 'other';
        if (key.includes('name')) fieldType = 'name';
        else if (key.includes('email')) fieldType = 'email';
        else if (key.includes('id')) fieldType = 'id';

        result[key] = this.generatePseudonym(stringValue, fieldType, session);
        continue;
      }

      // Handle quasi-identifiers based on level
      if (this.config.quasiIdentifiers.includes(key)) {
        if (this.config.level === 'full') {
          // Generalize quasi-identifiers
          result[key] = this.generalizeQuasiIdentifier(key, value);
        } else {
          // Keep for analytics utility
          result[key] = value;
        }
        continue;
      }

      // Pass through non-sensitive fields
      result[key] = value;
    }

    return result as AnonymizedStudent;
  }

  /**
   * Anonymize an array of student records
   */
  anonymizeStudents(
    students: StudentPII[],
    sessionId?: string
  ): AnonymizedStudent[] {
    const session = this.getOrCreateSession(sessionId);
    return students.map(student => this.anonymizeStudent(student, session.sessionId));
  }

  /**
   * Generalize quasi-identifiers to reduce re-identification risk
   */
  private generalizeQuasiIdentifier(field: string, value: unknown): unknown {
    if (value === null || value === undefined) return value;

    switch (field) {
      case 'date_of_birth':
        // Convert to year only
        if (typeof value === 'string') {
          const date = new Date(value);
          return `${date.getFullYear()}-01-01`;
        }
        return value;

      case 'zip_code':
        // Truncate to 3-digit prefix
        if (typeof value === 'string' && value.length >= 3) {
          return value.substring(0, 3) + '**';
        }
        return value;

      case 'ethnicity':
      case 'gender':
        // Keep as-is for analytics, but could be suppressed if needed
        return value;

      default:
        return value;
    }
  }

  /**
   * Reverse anonymization (for internal use only)
   * Returns original value if mapping exists
   */
  reverseAnonymization(
    anonymizedValue: string,
    fieldType: 'name' | 'email' | 'id' | 'other',
    sessionId: string
  ): string | null {
    const session = this.sessionMappings.get(sessionId);
    if (!session) return null;

    const key = `${fieldType}:${anonymizedValue}`;
    return session.reverseMappings.get(key) || null;
  }

  /**
   * Get session info (for audit logging)
   */
  getSessionInfo(sessionId: string): {
    exists: boolean;
    recordCount: number;
    expiresAt?: Date
  } {
    const session = this.sessionMappings.get(sessionId);
    if (!session) {
      return { exists: false, recordCount: 0 };
    }
    return {
      exists: true,
      recordCount: session.mappings.size,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Clear a session's mappings (for security)
   */
  clearSession(sessionId: string): void {
    this.sessionMappings.delete(sessionId);
  }

  /**
   * Clear all expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [id, session] of this.sessionMappings) {
      if (session.expiresAt <= now) {
        this.sessionMappings.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Aggregate data for complete anonymization
 * Returns only statistical summaries, no individual records
 */
export function aggregateStudentData(students: StudentPII[]): {
  totalCount: number;
  gradeDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  averageMetrics: Record<string, number>;
} {
  const gradeDistribution: Record<string, number> = {};
  const riskDistribution: Record<string, number> = {};
  const metricSums: Record<string, { sum: number; count: number }> = {};

  for (const student of students) {
    // Count grade distribution
    const grade = String(student.grade || 'Unknown');
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;

    // Count risk distribution
    const risk = String(student.risk_level || 'Unknown');
    riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;

    // Sum numeric metrics
    for (const [key, value] of Object.entries(student)) {
      if (typeof value === 'number' && !key.includes('id')) {
        if (!metricSums[key]) {
          metricSums[key] = { sum: 0, count: 0 };
        }
        metricSums[key].sum += value;
        metricSums[key].count += 1;
      }
    }
  }

  // Calculate averages
  const averageMetrics: Record<string, number> = {};
  for (const [key, { sum, count }] of Object.entries(metricSums)) {
    averageMetrics[key] = Math.round((sum / count) * 100) / 100;
  }

  return {
    totalCount: students.length,
    gradeDistribution,
    riskDistribution,
    averageMetrics,
  };
}

/**
 * Check if a string contains potential PII patterns
 */
export function detectPotentialPII(text: string): {
  hasPII: boolean;
  detectedPatterns: string[];
} {
  const patterns = [
    { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { name: 'phone', regex: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g },
    { name: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { name: 'date_of_birth', regex: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/g },
  ];

  const detected: string[] = [];

  for (const { name, regex } of patterns) {
    if (regex.test(text)) {
      detected.push(name);
    }
  }

  return {
    hasPII: detected.length > 0,
    detectedPatterns: detected,
  };
}

/**
 * Sanitize free-text fields that might contain PII
 */
export function sanitizeFreeText(text: string): string {
  let sanitized = text;

  // Replace email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // Replace phone numbers
  sanitized = sanitized.replace(
    /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
    '[PHONE_REDACTED]'
  );

  // Replace SSN patterns
  sanitized = sanitized.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    '[SSN_REDACTED]'
  );

  return sanitized;
}

// Export singleton factory for easy use
const anonymizerInstances = new Map<string, PIIAnonymizer>();

export function getAnonymizer(
  schoolId: string,
  config?: Partial<AnonymizationConfig>
): PIIAnonymizer {
  const key = `${schoolId}-${JSON.stringify(config || {})}`;

  if (!anonymizerInstances.has(key)) {
    anonymizerInstances.set(key, new PIIAnonymizer(schoolId, config));
  }

  return anonymizerInstances.get(key)!;
}
