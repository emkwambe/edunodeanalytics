import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/layout/legal-page-layout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms of Service | EduNode Analytics',
  description: 'Terms of Service governing your use of EduNode Analytics platform.',
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Please read these terms carefully before using our services."
      lastUpdated="March 1, 2026"
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using EduNode Analytics (&quot;Service&quot;), you agree to be bound by these
        Terms of Service (&quot;Terms&quot;). If you are using the Service on behalf of an organization
        (such as a school, school district, or charter management organization), you represent that
        you have the authority to bind that organization to these Terms.
      </p>
      <p>
        If you do not agree to these Terms, you may not access or use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        EduNode Analytics provides educational data analytics, student information management,
        intervention tracking, and related services designed for K-12 educational institutions.
        The Service includes:
      </p>
      <ul>
        <li>Dashboard and analytics features for student performance monitoring</li>
        <li>MTSS/RTI intervention planning and tracking tools</li>
        <li>Data integrations with Student Information Systems (SIS) and assessment platforms</li>
        <li>Reporting and compliance documentation tools</li>
        <li>Professional development resources</li>
      </ul>

      <h2>3. Account Registration</h2>
      <h3>3.1 Account Creation</h3>
      <p>
        To use the Service, you must create an account by providing accurate and complete
        information. You are responsible for maintaining the confidentiality of your account
        credentials and for all activities that occur under your account.
      </p>
      <h3>3.2 Organizational Accounts</h3>
      <p>
        Schools and organizations may create administrator accounts that can invite additional
        users. The organization is responsible for ensuring all users comply with these Terms
        and applicable data privacy laws.
      </p>

      <h2>4. Subscription and Payment</h2>
      <h3>4.1 Subscription Tiers</h3>
      <p>
        The Service is offered in multiple subscription tiers (Starter, Professional, and
        Enterprise) with varying features and pricing. Current pricing is available on our
        pricing page.
      </p>
      <h3>4.2 Billing</h3>
      <p>
        Subscriptions are billed annually in advance. Per-student pricing, where applicable,
        is calculated based on active enrollment at the start of each billing period.
      </p>
      <h3>4.3 Cancellation</h3>
      <p>
        You may cancel your subscription at any time. Cancellation will be effective at the
        end of your current billing period. We do not provide refunds for partial subscription
        periods.
      </p>

      <h2>5. Data Ownership and Privacy</h2>
      <h3>5.1 Your Data</h3>
      <p>
        You retain all ownership rights to the data you upload or input into the Service
        (&quot;Your Data&quot;). We do not claim any ownership interest in Your Data.
      </p>
      <h3>5.2 Student Data</h3>
      <p>
        We understand the sensitive nature of student educational records. Our handling of
        student data is governed by our Privacy Policy and complies with the Family Educational
        Rights and Privacy Act (FERPA). See our <a href="/ferpa">FERPA Compliance</a> page for
        detailed information.
      </p>
      <h3>5.3 Data Processing</h3>
      <p>
        We process Your Data solely to provide the Service to you. We do not sell, rent, or
        share Your Data with third parties for their marketing purposes.
      </p>

      <h2>6. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
        <li>Attempt to gain unauthorized access to any part of the Service</li>
        <li>Interfere with or disrupt the integrity or performance of the Service</li>
        <li>Upload or transmit viruses or malicious code</li>
        <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
        <li>Use the Service to store or transmit data in violation of third-party rights</li>
        <li>Share account credentials with unauthorized users</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <h3>7.1 Our Property</h3>
      <p>
        The Service, including all software, designs, text, graphics, and other content
        (excluding Your Data), is owned by EduNode Analytics and is protected by intellectual
        property laws.
      </p>
      <h3>7.2 Limited License</h3>
      <p>
        Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license
        to access and use the Service for your internal educational purposes during your
        subscription period.
      </p>

      <h2>8. Confidentiality</h2>
      <p>
        Each party agrees to maintain the confidentiality of the other party&apos;s confidential
        information and not to disclose it to third parties without prior written consent,
        except as required by law or to provide the Service.
      </p>

      <h2>9. Service Availability</h2>
      <h3>9.1 Uptime</h3>
      <p>
        We strive to maintain 99.9% uptime for the Service. Scheduled maintenance windows
        will be communicated in advance when possible.
      </p>
      <h3>9.2 Modifications</h3>
      <p>
        We may modify, suspend, or discontinue any part of the Service at any time. We will
        provide reasonable notice of any material changes that affect your use of the Service.
      </p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
        EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
      </p>
      <p>
        We do not warrant that the Service will be uninterrupted, error-free, or secure.
        Educational decisions should be made by qualified professionals using the Service
        as one of many tools.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, EDUNODE ANALYTICS SHALL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
        PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
      </p>
      <p>
        OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE
        AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless EduNode Analytics and its officers,
        directors, employees, and agents from any claims, damages, losses, or expenses arising
        from your use of the Service or violation of these Terms.
      </p>

      <h2>13. Term and Termination</h2>
      <h3>13.1 Term</h3>
      <p>
        These Terms remain in effect while you use the Service or maintain an account.
      </p>
      <h3>13.2 Termination</h3>
      <p>
        Either party may terminate these Terms for any reason upon thirty (30) days&apos; written
        notice. We may terminate immediately if you breach these Terms.
      </p>
      <h3>13.3 Effect of Termination</h3>
      <p>
        Upon termination, your right to use the Service ceases. We will provide a reasonable
        period for you to export Your Data. After that period, we may delete Your Data from
        our systems.
      </p>

      <h2>14. Dispute Resolution</h2>
      <h3>14.1 Governing Law</h3>
      <p>
        These Terms are governed by the laws of the State of Delaware, without regard to
        conflict of law principles.
      </p>
      <h3>14.2 Arbitration</h3>
      <p>
        Any disputes arising from these Terms shall be resolved through binding arbitration
        in accordance with the rules of the American Arbitration Association, except that
        either party may seek injunctive relief in court to prevent imminent harm.
      </p>

      <h2>15. General Provisions</h2>
      <h3>15.1 Entire Agreement</h3>
      <p>
        These Terms, together with our Privacy Policy and any order forms, constitute the
        entire agreement between you and EduNode Analytics regarding the Service.
      </p>
      <h3>15.2 Amendments</h3>
      <p>
        We may modify these Terms at any time. We will notify you of material changes via
        email or through the Service. Continued use after such notice constitutes acceptance.
      </p>
      <h3>15.3 Severability</h3>
      <p>
        If any provision of these Terms is found unenforceable, the remaining provisions
        will continue in effect.
      </p>
      <h3>15.4 Assignment</h3>
      <p>
        You may not assign these Terms without our prior written consent. We may assign
        these Terms in connection with a merger, acquisition, or sale of assets.
      </p>

      <h2>16. Contact Information</h2>
      <p>
        For questions about these Terms, please contact us at:
      </p>
      <p>
        <strong>EduNode Analytics</strong><br />
        Email: legal@edunode.com<br />
        Address: 123 Education Way, Suite 400, San Francisco, CA 94105
      </p>
    </LegalPageLayout>
  );
}
