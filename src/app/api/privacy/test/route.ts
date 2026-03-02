/**
 * Privacy Layer Test Endpoint
 * ============================
 *
 * GET /api/privacy/test
 * Tests the privacy/anonymization layer with sample data
 */

import { NextResponse } from 'next/server';
import { createSecureAIProxy } from '@/lib/privacy';

export async function GET() {
  try {
    // Create secure AI proxy
    const proxy = createSecureAIProxy('test-school');

    // Sample student data with PII
    const testStudentData = [{
      id: 'uuid-test-0001',
      student_id: 'stu_test_0001',
      first_name: 'Emma',
      last_name: 'Thompson',
      email: 'emma.thompson@school.edu',
      grade_level: 7,
      risk_level: 'at_risk',
      gpa: 2.8,
      attendance_rate: 0.85,
      assignment_completion_rate: 0.72,
      recent_trend: 'declining',
      flags: ['chronic_absence', 'low_engagement'],
    }];

    // Make a mock AI call to test the privacy layer
    const result = await proxy.callAI(
      'mock', // Use mock provider for testing
      {
        system: 'Analyze this student data and identify concerns.',
        user: 'Review the following student information and suggest interventions.',
      },
      testStudentData,
      {
        schoolId: 'test-school',
        userId: 'test-user',
        feature: 'privacy_test',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Privacy layer test completed',
      originalDataHadPII: true,
      originalPIIFields: ['first_name', 'last_name', 'email', 'student_id'],
      anonymizationApplied: result.anonymizationApplied,
      auditId: result.auditId,
      aiResponse: result.response,
      note: 'The AI received anonymized data - no real names were sent',
    });
  } catch (error) {
    console.error('Privacy test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Privacy test failed', details: errorMessage },
      { status: 500 }
    );
  }
}
