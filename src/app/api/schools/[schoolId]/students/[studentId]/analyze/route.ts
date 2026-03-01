/**
 * Student Analysis API
 * ====================
 *
 * POST /api/schools/[schoolId]/students/[studentId]/analyze
 * Analyze student data using AI with automatic PII anonymization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentById } from '@/lib/db/queries/students';
import { createSecureAIProxy, AIProvider } from '@/lib/privacy';

interface RouteParams {
  params: Promise<{ schoolId: string; studentId: string }>;
}

interface AnalyzeRequest {
  feature?: 'qualitative_pulse' | 'intervention_plan' | 'learning_patterns';
  provider?: AIProvider;
  useLiveAI?: boolean;
  customPrompt?: string;
  logs?: Array<{
    timestamp: string;
    type: string;
    content: string;
  }>;
}

/**
 * POST /api/schools/[schoolId]/students/[studentId]/analyze
 * Analyze student data with AI (PII automatically anonymized)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId, studentId } = await params;
    const body: AnalyzeRequest = await request.json();

    const {
      feature = 'qualitative_pulse',
      provider = 'anthropic',
      useLiveAI = false,
      customPrompt,
      logs = [],
    } = body;

    // Fetch the student
    const student = await getStudentById(studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Create secure AI proxy for this school
    const proxy = createSecureAIProxy(schoolId);

    // Determine which provider to use
    const effectiveProvider: AIProvider = useLiveAI ? provider : 'mock';

    // Build the system prompt based on feature
    const systemPrompts: Record<string, string> = {
      qualitative_pulse: `You are an educational analytics AI assistant helping teachers understand student well-being and engagement patterns. Analyze the provided student data and activity logs to identify:
1. Overall engagement level and trends
2. Emotional/behavioral indicators
3. Areas of strength and concern
4. Recommended interventions or support strategies

Be concise, actionable, and focus on patterns rather than individual data points.`,

      intervention_plan: `You are an educational intervention specialist AI. Based on the student's academic data and learning patterns, create a personalized intervention flight plan that includes:
1. Identified learning gaps or challenges
2. Phased intervention approach (2-4 weeks)
3. Specific activities and resources
4. Success metrics and checkpoints
5. Collaboration points with parents/guardians

Focus on evidence-based strategies appropriate for the student's grade level.`,

      learning_patterns: `You are a learning analytics AI. Analyze the student's academic data to identify:
1. Learning style indicators
2. Subject strengths and areas for growth
3. Optimal study patterns and times
4. Peer collaboration opportunities
5. Personalized learning recommendations

Provide actionable insights for both educators and the student.`,
    };

    const systemPrompt = systemPrompts[feature] || systemPrompts.qualitative_pulse;

    // Build user prompt with any custom additions
    let userPrompt = `Analyze the following student data and provide insights.`;

    if (logs.length > 0) {
      userPrompt += `\n\nActivity Logs:\n${JSON.stringify(logs, null, 2)}`;
    }

    if (customPrompt) {
      userPrompt += `\n\nAdditional Context: ${customPrompt}`;
    }

    // Prepare student data for AI (will be anonymized by the proxy)
    const studentData = [{
      student_id: student.id,
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email || '',
      grade_level: student.gradeLevel,
      risk_level: student.riskLevel,
      gpa: student.gpa,
      attendance_rate: student.attendanceRate,
      assignment_completion_rate: student.assignmentCompletionRate,
      recent_trend: student.recentTrend,
      flags: student.flags,
    }];

    // Make the secure AI call (PII automatically anonymized)
    const result = await proxy.callAI(
      effectiveProvider,
      {
        system: systemPrompt,
        user: userPrompt,
      },
      studentData,
      {
        schoolId,
        userId: 'api-user', // In production, get from auth
        feature,
      }
    );

    return NextResponse.json({
      success: true,
      studentId,
      feature,
      provider: effectiveProvider,
      analysis: result.response,
      auditId: result.auditId,
      anonymizationApplied: result.anonymizationApplied,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing student:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for API key errors
    if (errorMessage.includes('API key not configured')) {
      return NextResponse.json(
        {
          error: 'AI provider not configured',
          details: errorMessage,
          hint: 'Set the appropriate API key in your environment variables'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze student', details: errorMessage },
      { status: 500 }
    );
  }
}
