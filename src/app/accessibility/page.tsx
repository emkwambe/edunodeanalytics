import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/layout/legal-page-layout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accessibility Statement | EduNode Analytics',
  description: 'Our commitment to digital accessibility and WCAG 2.1 compliance.',
};

export default function AccessibilityPage() {
  return (
    <LegalPageLayout
      title="Accessibility Statement"
      description="EduNode Analytics is committed to ensuring digital accessibility for all users."
      lastUpdated="March 1, 2026"
    >
      <h2>Our Commitment</h2>
      <p>
        EduNode Analytics is committed to ensuring that our platform is accessible to everyone,
        including people with disabilities. We believe that all educators should have equal
        access to the tools they need to support student success.
      </p>
      <p>
        We strive to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards
        and are continuously working to improve the accessibility of our platform.
      </p>

      <h2>Accessibility Standards</h2>
      <h3>WCAG 2.1 Guidelines</h3>
      <p>
        We design and develop our platform following the four main principles of accessibility:
      </p>
      <ul>
        <li>
          <strong>Perceivable:</strong> Information and user interface components must be
          presentable to users in ways they can perceive
        </li>
        <li>
          <strong>Operable:</strong> User interface components and navigation must be operable
          by all users
        </li>
        <li>
          <strong>Understandable:</strong> Information and operation of the user interface
          must be understandable
        </li>
        <li>
          <strong>Robust:</strong> Content must be robust enough to be interpreted by a wide
          variety of user agents, including assistive technologies
        </li>
      </ul>

      <h3>Section 508 Compliance</h3>
      <p>
        For our customers in the public sector, we also work toward compliance with Section 508
        of the Rehabilitation Act, ensuring our platform can be used by federal agencies and
        organizations that receive federal funding.
      </p>

      <h2>Accessibility Features</h2>
      <h3>Navigation and Structure</h3>
      <ul>
        <li>Consistent navigation structure across all pages</li>
        <li>Skip navigation links to bypass repetitive content</li>
        <li>Logical heading hierarchy (H1, H2, H3, etc.)</li>
        <li>Breadcrumb navigation for orientation</li>
        <li>Clear page titles that describe content</li>
      </ul>

      <h3>Visual Design</h3>
      <ul>
        <li>Sufficient color contrast ratios (minimum 4.5:1 for normal text)</li>
        <li>Color is not the sole means of conveying information</li>
        <li>Resizable text up to 200% without loss of functionality</li>
        <li>Dark mode option to reduce eye strain</li>
        <li>Focus indicators visible for keyboard navigation</li>
      </ul>

      <h3>Keyboard Accessibility</h3>
      <ul>
        <li>All functionality available via keyboard</li>
        <li>Logical tab order through interactive elements</li>
        <li>Keyboard shortcuts for common actions (with documentation)</li>
        <li>No keyboard traps in any component</li>
        <li>Command palette (Cmd/Ctrl+K) for quick navigation</li>
      </ul>

      <h3>Screen Reader Support</h3>
      <ul>
        <li>Proper ARIA labels and roles</li>
        <li>Alternative text for images and icons</li>
        <li>Form labels properly associated with inputs</li>
        <li>Error messages announced to screen readers</li>
        <li>Live regions for dynamic content updates</li>
        <li>Tested with NVDA, JAWS, and VoiceOver</li>
      </ul>

      <h3>Data Visualization</h3>
      <ul>
        <li>Charts include text alternatives describing key data</li>
        <li>Data tables as alternatives to complex visualizations</li>
        <li>Patterns and shapes supplement color coding</li>
        <li>Screen reader accessible chart descriptions</li>
      </ul>

      <h3>Forms and Interactive Elements</h3>
      <ul>
        <li>Clear labels for all form fields</li>
        <li>Descriptive error messages with guidance</li>
        <li>Required fields clearly indicated</li>
        <li>Sufficient time to complete forms</li>
        <li>Confirmation before destructive actions</li>
      </ul>

      <h2>Assistive Technology Compatibility</h2>
      <p>
        EduNode Analytics is designed to work with assistive technologies including:
      </p>
      <ul>
        <li><strong>Screen Readers:</strong> NVDA, JAWS, VoiceOver (macOS/iOS), TalkBack (Android)</li>
        <li><strong>Voice Control:</strong> Dragon NaturallySpeaking, Voice Control (macOS)</li>
        <li><strong>Screen Magnification:</strong> ZoomText, Windows Magnifier, macOS Zoom</li>
        <li><strong>Alternative Input:</strong> Switch control, eye tracking devices</li>
      </ul>

      <h2>Browser Support</h2>
      <p>
        We support the latest versions of major browsers with accessibility features:
      </p>
      <ul>
        <li>Google Chrome (and Chromium-based browsers)</li>
        <li>Mozilla Firefox</li>
        <li>Apple Safari</li>
        <li>Microsoft Edge</li>
      </ul>

      <h2>Known Limitations</h2>
      <p>
        While we strive for comprehensive accessibility, we are aware of some current limitations:
      </p>
      <ul>
        <li>
          <strong>Complex Charts:</strong> Some interactive chart features may have limited
          screen reader support. We provide data table alternatives.
        </li>
        <li>
          <strong>Third-Party Integrations:</strong> Some connected services may have their
          own accessibility limitations outside our control.
        </li>
        <li>
          <strong>PDF Reports:</strong> Exported PDF reports may not be fully accessible.
          We are working on improved accessible export options.
        </li>
      </ul>
      <p>
        We maintain a backlog of accessibility improvements and prioritize them in our
        development roadmap.
      </p>

      <h2>Testing and Evaluation</h2>
      <p>We employ multiple methods to evaluate accessibility:</p>
      <ul>
        <li>Automated testing tools (axe-core, Lighthouse)</li>
        <li>Manual keyboard navigation testing</li>
        <li>Screen reader testing on multiple platforms</li>
        <li>Color contrast analysis</li>
        <li>User testing with people who use assistive technologies</li>
        <li>Third-party accessibility audits (annual)</li>
      </ul>

      <h2>Requesting Accessible Formats</h2>
      <p>
        If you need content from EduNode Analytics in an alternative format, please contact
        us. We will work with you to provide information in a format that meets your needs.
      </p>

      <h2>Feedback and Support</h2>
      <p>
        We welcome your feedback on the accessibility of EduNode Analytics. If you encounter
        any accessibility barriers or have suggestions for improvement, please contact us:
      </p>
      <p>
        <strong>Accessibility Team</strong><br />
        Email: accessibility@edunode.com<br />
        Phone: 1-800-EDU-NODE (1-800-338-6633) - Voice/TTY<br />
        Response time: We aim to respond to accessibility feedback within 2 business days
      </p>

      <h3>When Reporting an Issue</h3>
      <p>Please provide:</p>
      <ul>
        <li>The page URL where you encountered the issue</li>
        <li>A description of the problem</li>
        <li>The assistive technology you were using (if applicable)</li>
        <li>Your browser and operating system</li>
        <li>Steps to reproduce the issue</li>
      </ul>

      <h2>Continuous Improvement</h2>
      <p>
        Accessibility is an ongoing effort. We are committed to:
      </p>
      <ul>
        <li>Regular accessibility audits and testing</li>
        <li>Training our team on accessibility best practices</li>
        <li>Incorporating accessibility into our design and development processes</li>
        <li>Monitoring and addressing accessibility feedback</li>
        <li>Staying current with evolving accessibility standards</li>
      </ul>

      <h2>Additional Resources</h2>
      <p>
        Learn more about web accessibility:
      </p>
      <ul>
        <li>
          <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer">
            Web Content Accessibility Guidelines (WCAG)
          </a>
        </li>
        <li>
          <a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer">
            Americans with Disabilities Act (ADA)
          </a>
        </li>
        <li>
          <a href="https://www.section508.gov/" target="_blank" rel="noopener noreferrer">
            Section 508 Standards
          </a>
        </li>
        <li>
          <a href="https://webaim.org/" target="_blank" rel="noopener noreferrer">
            WebAIM - Web Accessibility In Mind
          </a>
        </li>
      </ul>

      <h2>Conformance Status</h2>
      <p>
        EduNode Analytics is currently working toward WCAG 2.1 Level AA conformance. Our most
        recent third-party accessibility audit was conducted in January 2026. We are actively
        addressing the findings from this audit.
      </p>
      <p>
        A copy of our Voluntary Product Accessibility Template (VPAT) is available upon request
        for enterprise customers.
      </p>
    </LegalPageLayout>
  );
}
