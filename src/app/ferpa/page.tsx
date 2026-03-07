import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/layout/legal-page-layout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FERPA Compliance | EduNode Analytics',
  description: 'Learn how EduNode Analytics ensures compliance with the Family Educational Rights and Privacy Act (FERPA).',
};

export default function FerpaCompliancePage() {
  return (
    <LegalPageLayout
      title="FERPA Compliance"
      description="Our commitment to protecting student educational records under the Family Educational Rights and Privacy Act."
      lastUpdated="March 1, 2026"
    >
      <h2>1. Our Commitment to FERPA</h2>
      <p>
        EduNode Analytics is fully committed to compliance with the Family Educational Rights
        and Privacy Act (FERPA), 20 U.S.C. &sect; 1232g; 34 CFR Part 99. We understand that student
        educational records are highly sensitive, and we have built our platform from the ground
        up with FERPA compliance as a core requirement.
      </p>

      <h2>2. School Official Designation</h2>
      <p>
        Under FERPA, educational institutions may disclose student education records to contractors,
        consultants, and other service providers (&quot;school officials&quot;) without parental consent when
        specific conditions are met. EduNode Analytics operates as a school official under this
        exception.
      </p>
      <h3>2.1 Qualifying Criteria</h3>
      <p>We meet FERPA&apos;s school official requirements because we:</p>
      <ul>
        <li>Perform services that would otherwise be performed by school employees</li>
        <li>Are under the direct control of the school regarding use and maintenance of education records</li>
        <li>Use education records only for the purposes specified in our agreement with the school</li>
        <li>Meet criteria for data security and confidentiality</li>
      </ul>

      <h3>2.2 Data Processing Agreement</h3>
      <p>
        Every school using EduNode Analytics enters into a Data Processing Agreement (DPA) that
        formally establishes our role as a school official and defines the permitted uses of
        student education records.
      </p>

      <h2>3. Legitimate Educational Interest</h2>
      <p>
        We access and process student education records only when there is a legitimate educational
        interest. Our services directly support educational functions including:
      </p>
      <ul>
        <li><strong>Academic Progress Monitoring:</strong> Tracking student achievement and growth</li>
        <li><strong>Early Intervention:</strong> Identifying students who may need additional support</li>
        <li><strong>MTSS/RTI Implementation:</strong> Supporting tiered intervention programs</li>
        <li><strong>Compliance Reporting:</strong> Generating required state and federal reports</li>
        <li><strong>Data-Driven Decision Making:</strong> Providing insights for educational improvement</li>
      </ul>

      <h2>4. Data Protection Measures</h2>
      <h3>4.1 Access Controls</h3>
      <p>We implement strict access controls to ensure that education records are accessed only by authorized personnel:</p>
      <ul>
        <li><strong>Role-Based Access Control (RBAC):</strong> Users see only the data appropriate to their role</li>
        <li><strong>Multi-Factor Authentication:</strong> Required for all users accessing student records</li>
        <li><strong>Single Sign-On (SSO):</strong> Integration with school identity providers</li>
        <li><strong>Session Management:</strong> Automatic timeout and secure session handling</li>
        <li><strong>IP Restrictions:</strong> Optional IP allowlisting for enterprise customers</li>
      </ul>

      <h3>4.2 Audit Logging</h3>
      <p>
        We maintain comprehensive audit logs of all access to student education records:
      </p>
      <ul>
        <li>Who accessed the record</li>
        <li>When the access occurred</li>
        <li>What data was viewed or modified</li>
        <li>The purpose of the access (feature used)</li>
        <li>IP address and device information</li>
      </ul>
      <p>
        Audit logs are retained for a minimum of 7 years and are available to school administrators
        upon request.
      </p>

      <h3>4.3 Technical Security</h3>
      <p>Our security infrastructure includes:</p>
      <ul>
        <li><strong>Encryption:</strong> AES-256 encryption at rest; TLS 1.3 in transit</li>
        <li><strong>Infrastructure:</strong> SOC 2 Type II certified cloud hosting</li>
        <li><strong>Network Security:</strong> Firewalls, intrusion detection, DDoS protection</li>
        <li><strong>Data Segregation:</strong> Logical separation of each school&apos;s data</li>
        <li><strong>Secure Development:</strong> Security-focused SDLC with regular code reviews</li>
        <li><strong>Penetration Testing:</strong> Annual third-party security assessments</li>
      </ul>

      <h2>5. Parental and Student Rights</h2>
      <h3>5.1 Right to Inspect and Review</h3>
      <p>
        Parents (or eligible students age 18+) have the right to inspect and review their
        student&apos;s education records. While we provide data to schools, requests to inspect
        records should be directed to the school, which maintains control of the records.
      </p>

      <h3>5.2 Right to Request Amendment</h3>
      <p>
        Parents may request that a school amend records they believe to be inaccurate or misleading.
        Schools can direct amendments through our platform, and we implement changes upon school
        authorization.
      </p>

      <h3>5.3 Right to Consent to Disclosures</h3>
      <p>
        FERPA generally requires parent consent before disclosing education records. The &quot;school
        official&quot; exception allows disclosure to EduNode Analytics without individual parent
        consent when our DPA is in place.
      </p>

      <h3>5.4 Right to File Complaints</h3>
      <p>
        Parents and eligible students may file complaints with the U.S. Department of Education
        concerning alleged FERPA violations:
      </p>
      <p>
        Family Policy Compliance Office<br />
        U.S. Department of Education<br />
        400 Maryland Avenue, SW<br />
        Washington, DC 20202-8520
      </p>

      <h2>6. Directory Information</h2>
      <p>
        FERPA allows schools to designate certain information as &quot;directory information&quot; that may
        be disclosed without consent. EduNode Analytics:
      </p>
      <ul>
        <li>Does not require directory information to function</li>
        <li>Does not publicly disclose any student information</li>
        <li>Treats all student data with the same high level of protection</li>
        <li>Follows school policies regarding directory information handling</li>
      </ul>

      <h2>7. Re-Disclosure Prohibition</h2>
      <p>
        We do not re-disclose education records to third parties without school authorization,
        except as permitted by law. When subprocessors are used (e.g., cloud infrastructure
        providers), they are bound by strict data protection agreements that prohibit unauthorized
        access or use of education records.
      </p>

      <h2>8. Data Retention and Deletion</h2>
      <h3>8.1 Retention Period</h3>
      <p>
        We retain student education records only as long as necessary to provide our services
        to the school. Schools direct our retention practices through their administrative
        settings and our DPA.
      </p>

      <h3>8.2 Record Deletion</h3>
      <p>Schools may request deletion of:</p>
      <ul>
        <li>Individual student records at any time</li>
        <li>All school data upon account termination</li>
        <li>Historical records beyond specified retention periods</li>
      </ul>

      <h3>8.3 Deletion Process</h3>
      <p>
        Upon receiving a valid deletion request, we delete records from production systems
        within 30 days. Backup copies are automatically purged within 180 days.
      </p>

      <h2>9. Breach Notification</h2>
      <p>
        In the event of a security incident involving unauthorized access to student education
        records, we will:
      </p>
      <ul>
        <li>Notify affected schools within 72 hours of discovery</li>
        <li>Provide detailed information about the nature and scope of the incident</li>
        <li>Assist schools in meeting their own notification obligations</li>
        <li>Implement corrective measures to prevent recurrence</li>
        <li>Cooperate with any investigations</li>
      </ul>

      <h2>10. Employee Training</h2>
      <p>
        All EduNode Analytics employees who may access student education records receive:
      </p>
      <ul>
        <li>FERPA compliance training upon hire</li>
        <li>Annual refresher training on privacy requirements</li>
        <li>Role-specific training on data handling procedures</li>
        <li>Security awareness training</li>
      </ul>

      <h2>11. State Student Privacy Laws</h2>
      <p>
        In addition to FERPA, we comply with state-specific student privacy laws, including:
      </p>
      <ul>
        <li><strong>California:</strong> Student Online Personal Information Protection Act (SOPIPA)</li>
        <li><strong>New York:</strong> Education Law 2-d and Part 121 Regulations</li>
        <li><strong>Colorado:</strong> Student Data Transparency and Security Act</li>
        <li><strong>Connecticut:</strong> Student Data Privacy Act</li>
        <li><strong>Louisiana:</strong> Student Privacy Act</li>
        <li>And additional state laws as applicable</li>
      </ul>

      <h2>12. Student Data Privacy Pledge</h2>
      <p>
        EduNode Analytics is a signatory to the Student Privacy Pledge, committing to:
      </p>
      <ul>
        <li>Not sell student personal information</li>
        <li>Not behaviorally target advertising to students</li>
        <li>Use data only for authorized educational purposes</li>
        <li>Not change privacy policies without notice and choice</li>
        <li>Enforce strict limits on data retention</li>
        <li>Support parental access to student data</li>
        <li>Maintain comprehensive security standards</li>
        <li>Be transparent about data collection and use</li>
      </ul>

      <h2>13. FERPA Resources</h2>
      <p>For more information about FERPA:</p>
      <ul>
        <li><a href="https://studentprivacy.ed.gov/" target="_blank" rel="noopener noreferrer">Student Privacy Policy Office (SPPO)</a></li>
        <li><a href="https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html" target="_blank" rel="noopener noreferrer">FERPA General Guidance</a></li>
        <li><a href="https://studentprivacy.ed.gov/faq" target="_blank" rel="noopener noreferrer">FERPA FAQs</a></li>
      </ul>

      <h2>14. Contact Our Privacy Team</h2>
      <p>
        For questions about FERPA compliance or to request our Data Processing Agreement:
      </p>
      <p>
        <strong>EduNode Analytics - Privacy &amp; Compliance</strong><br />
        Email: privacy@edunode.com<br />
        Phone: 1-800-EDU-NODE (1-800-338-6633)<br />
        Address: 123 Education Way, Suite 400, San Francisco, CA 94105
      </p>
    </LegalPageLayout>
  );
}
