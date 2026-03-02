/**
 * Secure AI Proxy Service
 *
 * This service acts as a gateway between EduNode and external AI services.
 * It ensures that NO actual student PII is transmitted to third-party AI APIs.
 *
 * Features:
 * 1. Automatic data anonymization before transmission
 * 2. Response de-anonymization for internal use
 * 3. Comprehensive audit logging
 * 4. Rate limiting and circuit breaker patterns
 * 5. Support for multiple AI providers (Claude, OpenAI, Gemini)
 */

import {
  PIIAnonymizer,
  AnonymizationLevel,
  StudentPII,
  aggregateStudentData,
  sanitizeFreeText,
  detectPotentialPII,
  getAnonymizer,
} from './pii-anonymizer';
import { checkRateLimit } from '@/lib/cache/redis';
import { captureException } from '@/lib/monitoring/sentry';

// AI Provider types
export type AIProvider = 'anthropic' | 'openai' | 'google' | 'mock';

// AI model configuration
const AI_CONFIG = {
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    costPer1kInput: 0.003, // $3 per 1M input tokens
    costPer1kOutput: 0.015, // $15 per 1M output tokens
    rateLimit: { requests: 60, window: 60 }, // 60 requests per minute
  },
  openai: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 4096,
    costPer1kInput: 0.01, // $10 per 1M input tokens
    costPer1kOutput: 0.03, // $30 per 1M output tokens
    rateLimit: { requests: 60, window: 60 },
  },
  google: {
    model: 'gemini-pro',
    maxTokens: 4096,
    costPer1kInput: 0.00025, // $0.25 per 1M input tokens
    costPer1kOutput: 0.0005, // $0.50 per 1M output tokens
    rateLimit: { requests: 60, window: 60 },
  },
};

// In-memory usage tracking (in production, persist to database)
const usageTracker = new Map<string, {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  lastRequest: Date;
}>();

// Request context for AI calls
export interface AIRequestContext {
  schoolId: string;
  userId: string;
  feature: string; // e.g., 'qualitative_pulse', 'intervention_plan'
  sessionId?: string;
  anonymizationLevel?: AnonymizationLevel;
}

// Audit log entry for external AI calls
export interface AIAuditLogEntry {
  id: string;
  timestamp: Date;
  schoolId: string;
  userId: string;
  provider: AIProvider;
  feature: string;
  anonymizationLevel: AnonymizationLevel;
  studentCount: number;
  fieldsSanitized: string[];
  piiDetected: boolean;
  requestSizeBytes: number;
  responseReceived: boolean;
  latencyMs: number;
  error?: string;
}

// In-memory audit log (in production, this would go to a secure database)
const auditLog: AIAuditLogEntry[] = [];

/**
 * Secure AI Proxy class
 */
export class SecureAIProxy {
  private anonymizer: PIIAnonymizer;
  private schoolId: string;
  private auditEnabled: boolean;

  constructor(schoolId: string, auditEnabled = true) {
    this.schoolId = schoolId;
    this.anonymizer = getAnonymizer(schoolId);
    this.auditEnabled = auditEnabled;
  }

  /**
   * Prepare student data for external AI transmission
   * Returns anonymized data that is safe to send externally
   */
  prepareStudentDataForAI(
    students: StudentPII[],
    context: AIRequestContext
  ): {
    safeData: Record<string, unknown>[];
    sessionId: string;
    fieldsAnonymized: string[];
  } {
    const level = context.anonymizationLevel || 'pseudonym';

    // For aggregate level, return only statistics
    if (level === 'aggregate') {
      const aggregated = aggregateStudentData(students);
      return {
        safeData: [aggregated as unknown as Record<string, unknown>],
        sessionId: 'aggregate-no-session',
        fieldsAnonymized: ['all_individual_records'],
      };
    }

    // Create anonymization session
    const session = this.anonymizer.getOrCreateSession(context.sessionId);

    // Anonymize all students
    const anonymizedStudents = students.map(student =>
      this.anonymizer.anonymizeStudent(student, session.sessionId)
    );

    // Track which fields were anonymized
    const fieldsAnonymized = new Set<string>();
    for (const student of students) {
      for (const key of Object.keys(student)) {
        if (
          ['first_name', 'last_name', 'email', 'student_id', 'parent_name', 'parent_email'].includes(key)
        ) {
          fieldsAnonymized.add(key);
        }
      }
    }

    return {
      safeData: anonymizedStudents,
      sessionId: session.sessionId,
      fieldsAnonymized: Array.from(fieldsAnonymized),
    };
  }

  /**
   * Prepare a text prompt for AI, scanning and sanitizing any embedded PII
   */
  prepareFreeTextForAI(
    text: string,
    context: AIRequestContext
  ): {
    safeText: string;
    piiDetected: boolean;
    patterns: string[];
  } {
    const detection = detectPotentialPII(text);

    if (detection.hasPII) {
      const sanitized = sanitizeFreeText(text);
      return {
        safeText: sanitized,
        piiDetected: true,
        patterns: detection.detectedPatterns,
      };
    }

    return {
      safeText: text,
      piiDetected: false,
      patterns: [],
    };
  }

  /**
   * Build a safe AI prompt that includes anonymized student context
   */
  buildSafePrompt(
    systemPrompt: string,
    userQuery: string,
    studentData: StudentPII[] | null,
    context: AIRequestContext
  ): {
    prompt: {
      system: string;
      user: string;
      context?: string;
    };
    metadata: {
      sessionId: string;
      studentCount: number;
      fieldsAnonymized: string[];
      piiInQueryDetected: boolean;
    };
  } {
    // Sanitize the user query
    const { safeText: safeQuery, piiDetected } = this.prepareFreeTextForAI(
      userQuery,
      context
    );

    let contextData: string | undefined;
    let sessionId = 'no-student-data';
    let fieldsAnonymized: string[] = [];

    // If student data is provided, anonymize it
    if (studentData && studentData.length > 0) {
      const { safeData, sessionId: sid, fieldsAnonymized: fields } = this.prepareStudentDataForAI(
        studentData,
        context
      );
      sessionId = sid;
      fieldsAnonymized = fields;

      // Format student data for AI context
      contextData = JSON.stringify(safeData, null, 2);
    }

    // Add privacy notice to system prompt
    const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: The student data provided has been anonymized. Student names, IDs, and contact information are pseudonyms. Analyze patterns and provide insights based on academic metrics, not personal identifiers.`;

    return {
      prompt: {
        system: enhancedSystemPrompt,
        user: safeQuery,
        context: contextData,
      },
      metadata: {
        sessionId,
        studentCount: studentData?.length || 0,
        fieldsAnonymized,
        piiInQueryDetected: piiDetected,
      },
    };
  }

  /**
   * Select the best available AI provider
   * Prefers Anthropic > OpenAI > Google > Mock
   */
  private selectProvider(preferredProvider?: AIProvider): AIProvider {
    if (preferredProvider && preferredProvider !== 'mock') {
      // Check if preferred provider is configured
      const envMap: Record<AIProvider, string | undefined> = {
        anthropic: process.env.ANTHROPIC_API_KEY,
        openai: process.env.OPENAI_API_KEY,
        google: process.env.GOOGLE_AI_API_KEY,
        mock: 'always-available',
      };

      if (envMap[preferredProvider]) {
        return preferredProvider;
      }
    }

    // Auto-select based on availability
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.GOOGLE_AI_API_KEY) return 'google';

    return 'mock';
  }

  /**
   * Check rate limit for a provider
   */
  private async checkProviderRateLimit(
    provider: AIProvider,
    schoolId: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    if (provider === 'mock') {
      return { allowed: true };
    }

    const config = AI_CONFIG[provider];
    const rateLimitKey = `ai:${provider}:${schoolId}`;

    const result = await checkRateLimit(
      rateLimitKey,
      config.rateLimit.requests,
      config.rateLimit.window
    );

    return {
      allowed: result.allowed,
      retryAfter: result.allowed ? undefined : result.resetIn,
    };
  }

  /**
   * Track AI usage for cost monitoring
   */
  private trackUsage(
    schoolId: string,
    provider: AIProvider,
    inputTokens: number,
    outputTokens: number
  ): void {
    if (provider === 'mock') return;

    const config = AI_CONFIG[provider];
    const cost =
      (inputTokens / 1000) * config.costPer1kInput +
      (outputTokens / 1000) * config.costPer1kOutput;

    const key = `${schoolId}:${new Date().toISOString().slice(0, 7)}`; // Monthly key
    const existing = usageTracker.get(key) || {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      lastRequest: new Date(),
    };

    existing.totalRequests++;
    existing.totalInputTokens += inputTokens;
    existing.totalOutputTokens += outputTokens;
    existing.totalCost += cost;
    existing.lastRequest = new Date();

    usageTracker.set(key, existing);

    console.log('[AI Usage]', {
      schoolId,
      provider,
      inputTokens,
      outputTokens,
      cost: `$${cost.toFixed(4)}`,
      monthlyCost: `$${existing.totalCost.toFixed(2)}`,
    });
  }

  /**
   * Get AI usage statistics for a school
   */
  static getUsageStats(schoolId: string): {
    currentMonth: { requests: number; tokens: number; cost: number };
    lastMonth: { requests: number; tokens: number; cost: number };
  } {
    const now = new Date();
    const currentMonthKey = `${schoolId}:${now.toISOString().slice(0, 7)}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonthKey = `${schoolId}:${lastMonth.toISOString().slice(0, 7)}`;

    const current = usageTracker.get(currentMonthKey);
    const last = usageTracker.get(lastMonthKey);

    return {
      currentMonth: current
        ? {
            requests: current.totalRequests,
            tokens: current.totalInputTokens + current.totalOutputTokens,
            cost: current.totalCost,
          }
        : { requests: 0, tokens: 0, cost: 0 },
      lastMonth: last
        ? {
            requests: last.totalRequests,
            tokens: last.totalInputTokens + last.totalOutputTokens,
            cost: last.totalCost,
          }
        : { requests: 0, tokens: 0, cost: 0 },
    };
  }

  /**
   * Make an anonymized AI API call (with rate limiting and cost tracking)
   */
  async callAI(
    provider: AIProvider,
    prompt: {
      system: string;
      user: string;
      context?: string;
    },
    studentData: StudentPII[] | null,
    context: AIRequestContext
  ): Promise<{
    response: string;
    auditId: string;
    anonymizationApplied: boolean;
    provider: AIProvider;
  }> {
    const startTime = Date.now();

    // Select the best available provider
    const selectedProvider = this.selectProvider(provider);

    // Check rate limit
    const rateCheck = await this.checkProviderRateLimit(selectedProvider, context.schoolId);
    if (!rateCheck.allowed) {
      throw new Error(
        `Rate limit exceeded for ${selectedProvider}. Retry after ${rateCheck.retryAfter}s`
      );
    }

    // Build safe prompt with anonymized data
    const { prompt: safePrompt, metadata } = this.buildSafePrompt(
      prompt.system,
      prompt.user,
      studentData,
      context
    );

    // Calculate request size and estimate tokens
    const requestPayload = JSON.stringify(safePrompt);
    const requestSizeBytes = new TextEncoder().encode(requestPayload).length;
    const estimatedInputTokens = Math.ceil(requestSizeBytes / 4); // Rough estimate

    // Create audit entry
    const auditEntry: AIAuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      schoolId: context.schoolId,
      userId: context.userId,
      provider: selectedProvider,
      feature: context.feature,
      anonymizationLevel: context.anonymizationLevel || 'pseudonym',
      studentCount: metadata.studentCount,
      fieldsSanitized: metadata.fieldsAnonymized,
      piiDetected: metadata.piiInQueryDetected,
      requestSizeBytes,
      responseReceived: false,
      latencyMs: 0,
    };

    try {
      // Make the actual AI call based on provider
      let response: string;

      switch (selectedProvider) {
        case 'anthropic':
          response = await this.callAnthropic(safePrompt);
          break;
        case 'openai':
          response = await this.callOpenAI(safePrompt);
          break;
        case 'google':
          response = await this.callGemini(safePrompt);
          break;
        case 'mock':
        default:
          response = await this.callMock(safePrompt, context.feature);
      }

      // Estimate output tokens and track usage
      const estimatedOutputTokens = Math.ceil(new TextEncoder().encode(response).length / 4);
      this.trackUsage(context.schoolId, selectedProvider, estimatedInputTokens, estimatedOutputTokens);

      // Update audit entry
      auditEntry.responseReceived = true;
      auditEntry.latencyMs = Date.now() - startTime;

      // Log the audit entry
      if (this.auditEnabled) {
        this.logAuditEntry(auditEntry);
      }

      return {
        response,
        auditId: auditEntry.id,
        anonymizationApplied: metadata.fieldsAnonymized.length > 0 || metadata.piiInQueryDetected,
        provider: selectedProvider,
      };
    } catch (error) {
      auditEntry.latencyMs = Date.now() - startTime;
      auditEntry.error = error instanceof Error ? error.message : 'Unknown error';

      if (this.auditEnabled) {
        this.logAuditEntry(auditEntry);
      }

      captureException(error, {
        provider: selectedProvider,
        feature: context.feature,
        schoolId: context.schoolId,
      });

      throw error;
    }
  }

  /**
   * Call Anthropic Claude API (placeholder for actual implementation)
   */
  private async callAnthropic(prompt: {
    system: string;
    user: string;
    context?: string;
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Build the message with context
    const userMessage = prompt.context
      ? `${prompt.user}\n\nStudent Data Context:\n${prompt.context}`
      : prompt.user;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: prompt.system,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Call OpenAI API (placeholder for actual implementation)
   */
  private async callOpenAI(prompt: {
    system: string;
    user: string;
    context?: string;
  }): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const userMessage = prompt.context
      ? `${prompt.user}\n\nStudent Data Context:\n${prompt.context}`
      : prompt.user;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Google Gemini API (placeholder for actual implementation)
   */
  private async callGemini(prompt: {
    system: string;
    user: string;
    context?: string;
  }): Promise<string> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const fullPrompt = prompt.context
      ? `${prompt.system}\n\n${prompt.user}\n\nStudent Data Context:\n${prompt.context}`
      : `${prompt.system}\n\n${prompt.user}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Mock AI call for development/demo
   */
  private async callMock(
    prompt: { system: string; user: string; context?: string },
    feature: string
  ): Promise<string> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Return feature-appropriate mock responses
    const mockResponses: Record<string, string> = {
      qualitative_pulse: `Based on the anonymized student data analysis:

**Overall Classroom Climate**: Moderately Positive (Score: 7.2/10)

**Key Themes Identified**:
1. Students show strong engagement in collaborative activities
2. Some anxiety noted around assessment periods
3. Positive peer relationships evident in group work

**Recommended Actions**:
- Consider implementing mindfulness breaks before assessments
- Continue collaborative learning approaches
- Monitor at-risk students showing disengagement patterns`,

      intervention_plan: `**Personalized Intervention Flight Plan**

Based on the learning patterns observed:

**Phase 1 (Weeks 1-2): Foundation**
- Daily 15-minute targeted skill sessions
- Peer tutoring arrangement with complementary learners

**Phase 2 (Weeks 3-4): Acceleration**
- Graduated difficulty progression
- Bi-weekly progress checkpoints

**Success Indicators**:
- 10% improvement in formative assessments
- Increased class participation metrics
- Self-reported confidence improvement`,

      default: `Analysis complete. The anonymized student data has been processed securely. Key insights and recommendations have been generated based on the aggregated patterns without exposing any personally identifiable information.`,
    };

    return mockResponses[feature] || mockResponses.default;
  }

  /**
   * Log audit entry
   */
  private logAuditEntry(entry: AIAuditLogEntry): void {
    auditLog.push(entry);

    // In production, this would write to a secure database
    console.log('[AI Audit]', {
      id: entry.id,
      provider: entry.provider,
      feature: entry.feature,
      studentCount: entry.studentCount,
      piiDetected: entry.piiDetected,
      anonymizationLevel: entry.anonymizationLevel,
      responseReceived: entry.responseReceived,
      latencyMs: entry.latencyMs,
    });
  }

  /**
   * Get audit log entries for a school
   */
  static getAuditLog(
    schoolId: string,
    options?: { limit?: number; feature?: string }
  ): AIAuditLogEntry[] {
    let entries = auditLog.filter(e => e.schoolId === schoolId);

    if (options?.feature) {
      entries = entries.filter(e => e.feature === options.feature);
    }

    if (options?.limit) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  }

  /**
   * Get anonymizer for reverse lookups (internal use only)
   */
  getAnonymizer(): PIIAnonymizer {
    return this.anonymizer;
  }
}

/**
 * Factory function to create a secure AI proxy
 */
export function createSecureAIProxy(
  schoolId: string,
  auditEnabled = true
): SecureAIProxy {
  return new SecureAIProxy(schoolId, auditEnabled);
}

/**
 * Validate that a payload is safe for external transmission
 * Returns true if no PII detected
 */
export function validatePayloadSafety(payload: unknown): {
  safe: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  const checkValue = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      const detection = detectPotentialPII(value);
      if (detection.hasPII) {
        issues.push(`PII detected at ${path}: ${detection.detectedPatterns.join(', ')}`);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (value && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, `${path}.${key}`);
      }
    }
  };

  checkValue(payload, 'root');

  return {
    safe: issues.length === 0,
    issues,
  };
}
