import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Demo Request API
 *
 * Handles demo request form submissions from /demo page.
 * In production, this would:
 * - Store the lead in a CRM (HubSpot, Salesforce, etc.)
 * - Send notification email to sales team
 * - Send confirmation email to requester
 * - Track analytics event
 */

const demoRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  schoolName: z.string().min(1, 'School name is required'),
  schoolSize: z.string().min(1, 'School size is required'),
  role: z.string().min(1, 'Role is required'),
  currentTools: z.string().optional(),
  priorities: z.string().optional(),
});

export type DemoRequest = z.infer<typeof demoRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = demoRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const demoRequest = validationResult.data;

    // Log the request (in production, this would go to a CRM/database)
    console.log('[Demo Request]', {
      timestamp: new Date().toISOString(),
      ...demoRequest,
      // Mask email for logs
      email: demoRequest.email.replace(/(.{2}).*@/, '$1***@'),
    });

    // In production, integrate with:
    // 1. CRM (HubSpot, Salesforce)
    // await hubspot.contacts.create({ email: demoRequest.email, ... });

    // 2. Email service (SendGrid, Resend)
    // await sendEmail({
    //   to: 'sales@edunode.com',
    //   subject: `New Demo Request: ${demoRequest.schoolName}`,
    //   template: 'demo-request-notification',
    //   data: demoRequest,
    // });

    // 3. Send confirmation to requester
    // await sendEmail({
    //   to: demoRequest.email,
    //   subject: 'Your EduNode Demo Request',
    //   template: 'demo-request-confirmation',
    //   data: { firstName: demoRequest.firstName },
    // });

    // 4. Analytics tracking
    // await analytics.track('demo_requested', {
    //   schoolSize: demoRequest.schoolSize,
    //   role: demoRequest.role,
    // });

    return NextResponse.json(
      {
        success: true,
        message: 'Demo request received. Our team will contact you within 1 business day.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Demo Request Error]', error);

    return NextResponse.json(
      {
        error: 'Failed to process demo request',
        message: 'Please try again or contact sales@edunode.com',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if API is available
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/demo-request',
    method: 'POST',
    status: 'available',
  });
}
