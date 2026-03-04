import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/layout/legal-page-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy | EduNode Analytics',
  description: 'Learn how EduNode Analytics collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Your privacy is critically important to us. This policy explains how we collect, use, and protect your information."
      lastUpdated="March 1, 2026"
    >
      <h2>1. Introduction</h2>
      <p>
        EduNode Analytics (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the privacy of
        students, educators, and educational institutions that use our platform. This Privacy
        Policy explains how we collect, use, disclose, and safeguard information when you use
        our educational analytics service.
      </p>
      <p>
        As an education technology provider, we take special care to comply with applicable
        privacy laws, including the Family Educational Rights and Privacy Act (FERPA), the
        Children&apos;s Online Privacy Protection Act (COPPA), and state student privacy laws.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Information Provided by Schools</h3>
      <p>When schools use our Service, they may provide us with:</p>
      <ul>
        <li><strong>Student Records:</strong> Names, student IDs, grade levels, demographic information, attendance records, assessment scores, and intervention data</li>
        <li><strong>Staff Information:</strong> Names, email addresses, roles, and professional credentials</li>
        <li><strong>School Information:</strong> School name, address, district affiliation, and enrollment data</li>
      </ul>

      <h3>2.2 Information Collected Automatically</h3>
      <p>When you use our Service, we automatically collect:</p>
      <ul>
        <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, and actions taken within the platform</li>
        <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address</li>
        <li><strong>Log Data:</strong> Access times, error logs, and system performance data</li>
      </ul>

      <h3>2.3 Information from Third-Party Integrations</h3>
      <p>
        When you connect third-party services (such as Student Information Systems, LMS platforms,
        or assessment providers), we receive data according to the permissions you grant during
        the connection process.
      </p>

      <h2>3. How We Use Information</h2>
      <h3>3.1 Primary Purposes</h3>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Generate analytics, reports, and insights for educators</li>
        <li>Identify students who may need additional support or intervention</li>
        <li>Track intervention effectiveness and student progress</li>
        <li>Ensure compliance with state and federal reporting requirements</li>
        <li>Provide customer support and respond to inquiries</li>
      </ul>

      <h3>3.2 AI and Machine Learning</h3>
      <p>
        Our Service may use artificial intelligence and machine learning to provide insights
        such as early warning indicators and intervention recommendations. When processing
        data through AI systems:
      </p>
      <ul>
        <li>We anonymize or de-identify data before processing when possible</li>
        <li>We do not use student data to train general-purpose AI models</li>
        <li>AI-generated insights are provided to support, not replace, educator judgment</li>
      </ul>

      <h3>3.3 Aggregated and De-Identified Data</h3>
      <p>
        We may create aggregated, de-identified, or anonymized data that cannot reasonably
        be used to identify any individual. We may use this data for research, product
        development, and industry benchmarking.
      </p>

      <h2>4. How We Share Information</h2>
      <h3>4.1 We Do NOT</h3>
      <ul>
        <li>Sell student personal information to third parties</li>
        <li>Use student data for targeted advertising</li>
        <li>Share student data with third parties for their own marketing purposes</li>
        <li>Create advertising profiles based on student data</li>
      </ul>

      <h3>4.2 We May Share Information With</h3>
      <ul>
        <li><strong>School Officials:</strong> Authorized school personnel access data according to their roles and permissions</li>
        <li><strong>Service Providers:</strong> Third parties who assist us in operating the Service (hosting, support, analytics) under strict data protection agreements</li>
        <li><strong>Integration Partners:</strong> When you connect third-party services, data flows according to your configuration</li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with continued privacy protections</li>
      </ul>

      <h2>5. Student Privacy Protections</h2>
      <h3>5.1 FERPA Compliance</h3>
      <p>
        We operate as a &quot;school official&quot; under FERPA, processing student education records
        on behalf of schools. Schools retain control over their student data and direct how
        it may be used. See our <a href="/ferpa">FERPA Compliance</a> page for details.
      </p>

      <h3>5.2 COPPA Compliance</h3>
      <p>
        Our Service is designed for use by schools and educators, not directly by children
        under 13. Schools are responsible for obtaining necessary parental consents as required
        by COPPA before providing student information to our Service.
      </p>

      <h3>5.3 State Student Privacy Laws</h3>
      <p>
        We comply with applicable state student privacy laws, including but not limited to
        SOPIPA (California), NY Education Law 2-d (New York), and similar state requirements.
      </p>

      <h2>6. Data Security</h2>
      <p>
        We implement comprehensive security measures to protect your data:
      </p>
      <ul>
        <li><strong>Encryption:</strong> Data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
        <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
        <li><strong>Infrastructure:</strong> SOC 2 Type II compliant cloud infrastructure</li>
        <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
        <li><strong>Auditing:</strong> Comprehensive audit logs of data access and modifications</li>
        <li><strong>Training:</strong> Regular security training for all personnel</li>
        <li><strong>Incident Response:</strong> Documented procedures for security incident response</li>
      </ul>

      <h2>7. Data Retention</h2>
      <h3>7.1 Active Accounts</h3>
      <p>
        We retain data while your account is active and as needed to provide the Service.
        Schools may request deletion of specific student records at any time.
      </p>

      <h3>7.2 After Termination</h3>
      <p>
        Upon account termination, we provide a 90-day period for data export. After this
        period, we delete or anonymize your data within 30 days, except as required by law.
      </p>

      <h3>7.3 Backup Data</h3>
      <p>
        Backup copies may persist in our systems for up to 180 days after deletion from
        primary systems, solely for disaster recovery purposes.
      </p>

      <h2>8. Your Rights and Choices</h2>
      <h3>8.1 School Administrator Rights</h3>
      <p>School administrators can:</p>
      <ul>
        <li>Access and export all school data</li>
        <li>Correct inaccurate information</li>
        <li>Delete student records</li>
        <li>Manage user access and permissions</li>
        <li>Configure data integrations</li>
        <li>Request account termination</li>
      </ul>

      <h3>8.2 Parent and Student Rights</h3>
      <p>
        Parents and eligible students (18+) have rights under FERPA to inspect and review
        student records, request corrections, and consent to disclosures. These requests
        should be directed to the student&apos;s school, which controls the data.
      </p>

      <h3>8.3 California Privacy Rights</h3>
      <p>
        California residents have additional rights under CCPA/CPRA. However, student education
        records are generally exempt from CCPA as they are covered by FERPA.
      </p>

      <h2>9. Cookies and Tracking</h2>
      <p>
        We use cookies and similar technologies for authentication, preferences, and analytics.
        See our <a href="/cookies">Cookie Policy</a> for detailed information about our use
        of cookies and your choices.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Our Service is hosted in the United States. If you access the Service from outside
        the United States, your data will be transferred to and processed in the United States.
        We implement appropriate safeguards for international transfers, including Standard
        Contractual Clauses where required.
      </p>

      <h2>11. Third-Party Links</h2>
      <p>
        Our Service may contain links to third-party websites or services. We are not
        responsible for the privacy practices of these third parties. We encourage you
        to review their privacy policies.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by email and/or by posting notice on our Service. Your continued use after
        such notice constitutes acceptance of the updated policy.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our privacy practices, please contact:
      </p>
      <p>
        <strong>EduNode Analytics - Privacy Team</strong><br />
        Email: privacy@edunode.com<br />
        Address: 123 Education Way, Suite 400, San Francisco, CA 94105
      </p>
      <p>
        For data protection inquiries in the EU, you may also contact our EU representative
        at: eu-privacy@edunode.com
      </p>
    </LegalPageLayout>
  );
}
