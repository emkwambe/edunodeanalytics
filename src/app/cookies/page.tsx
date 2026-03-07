import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/layout/legal-page-layout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cookie Policy | EduNode Analytics',
  description: 'Learn how EduNode Analytics uses cookies and similar technologies.',
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="This policy explains how we use cookies and similar technologies on our platform."
      lastUpdated="March 1, 2026"
    >
      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files that are stored on your device (computer, tablet, or mobile
        phone) when you visit a website. They help websites remember your preferences and
        understand how you use the site. Cookies are widely used to make websites work more
        efficiently and to provide information to site owners.
      </p>

      <h2>2. How We Use Cookies</h2>
      <p>
        EduNode Analytics uses cookies and similar technologies for several important purposes:
      </p>

      <h3>2.1 Essential Cookies (Required)</h3>
      <p>
        These cookies are necessary for the platform to function properly. They cannot be
        disabled. Essential cookies are used for:
      </p>
      <ul>
        <li><strong>Authentication:</strong> Keeping you logged in securely during your session</li>
        <li><strong>Security:</strong> Protecting against cross-site request forgery (CSRF) attacks</li>
        <li><strong>Session Management:</strong> Maintaining your session state across pages</li>
        <li><strong>Load Balancing:</strong> Distributing traffic across our servers</li>
        <li><strong>User Preferences:</strong> Remembering your school context and dashboard settings</li>
      </ul>

      <h3>2.2 Functional Cookies</h3>
      <p>
        These cookies enhance your experience by remembering your preferences:
      </p>
      <ul>
        <li><strong>Language Settings:</strong> Remembering your language preference</li>
        <li><strong>Display Preferences:</strong> Dark mode, compact view, and layout choices</li>
        <li><strong>Recent Activity:</strong> Recently viewed students or reports</li>
        <li><strong>Form Data:</strong> Saving partially completed forms</li>
      </ul>

      <h3>2.3 Analytics Cookies</h3>
      <p>
        These cookies help us understand how users interact with our platform so we can improve it:
      </p>
      <ul>
        <li><strong>Usage Patterns:</strong> Which features are most used</li>
        <li><strong>Performance Metrics:</strong> Page load times and errors</li>
        <li><strong>Navigation Paths:</strong> How users move through the application</li>
        <li><strong>Feature Adoption:</strong> Understanding which features provide value</li>
      </ul>
      <p>
        We use analytics cookies in aggregate form and do not use them to track individual
        student data or educational records.
      </p>

      <h2>3. Cookies We Use</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 font-semibold">Cookie Name</th>
            <th className="text-left py-2 font-semibold">Purpose</th>
            <th className="text-left py-2 font-semibold">Duration</th>
            <th className="text-left py-2 font-semibold">Type</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2"><code>__session</code></td>
            <td className="py-2">Authentication session</td>
            <td className="py-2">Session</td>
            <td className="py-2">Essential</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2"><code>__clerk_*</code></td>
            <td className="py-2">Authentication provider</td>
            <td className="py-2">Variable</td>
            <td className="py-2">Essential</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2"><code>csrf_token</code></td>
            <td className="py-2">Security protection</td>
            <td className="py-2">Session</td>
            <td className="py-2">Essential</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2"><code>school_context</code></td>
            <td className="py-2">Selected school</td>
            <td className="py-2">30 days</td>
            <td className="py-2">Functional</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2"><code>theme</code></td>
            <td className="py-2">Light/dark mode preference</td>
            <td className="py-2">1 year</td>
            <td className="py-2">Functional</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2"><code>_edunode_analytics</code></td>
            <td className="py-2">Usage analytics</td>
            <td className="py-2">1 year</td>
            <td className="py-2">Analytics</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Third-Party Cookies</h2>
      <p>
        We may use third-party services that set their own cookies:
      </p>
      <ul>
        <li><strong>Clerk (Authentication):</strong> Manages secure authentication sessions</li>
        <li><strong>Stripe (Payments):</strong> Processes subscription payments securely</li>
        <li><strong>PostHog (Analytics):</strong> Provides product analytics (opt-in)</li>
        <li><strong>Sentry (Error Tracking):</strong> Monitors application errors</li>
      </ul>
      <p>
        These services have their own privacy policies governing their use of cookies. We
        select partners who maintain high privacy and security standards.
      </p>

      <h2>5. Managing Cookies</h2>
      <h3>5.1 Browser Settings</h3>
      <p>
        Most web browsers allow you to control cookies through their settings. You can typically:
      </p>
      <ul>
        <li>View what cookies are stored on your device</li>
        <li>Delete all or specific cookies</li>
        <li>Block cookies from certain sites</li>
        <li>Block all cookies (though this may prevent our platform from working)</li>
        <li>Set preferences for third-party cookies</li>
      </ul>

      <h3>5.2 Browser-Specific Instructions</h3>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h3>5.3 Platform Settings</h3>
      <p>
        Within your EduNode Analytics account, you can manage certain cookie preferences:
      </p>
      <ul>
        <li>Analytics opt-out in your account settings</li>
        <li>Preference reset options</li>
        <li>Session timeout controls</li>
      </ul>

      <h2>6. Impact of Disabling Cookies</h2>
      <p>
        If you choose to disable cookies, please be aware that:
      </p>
      <ul>
        <li><strong>Essential cookies:</strong> Disabling these will prevent you from logging in or using the platform</li>
        <li><strong>Functional cookies:</strong> You may need to re-enter preferences each session</li>
        <li><strong>Analytics cookies:</strong> Disabling these has no impact on functionality</li>
      </ul>

      <h2>7. Do Not Track</h2>
      <p>
        Some browsers offer a &quot;Do Not Track&quot; (DNT) setting. Our platform currently does not
        respond to DNT signals, as there is no industry standard for interpreting them. However,
        you can manage cookies through the methods described above.
      </p>

      <h2>8. Local Storage and Session Storage</h2>
      <p>
        In addition to cookies, we use browser local storage and session storage for:
      </p>
      <ul>
        <li>Caching dashboard data for faster load times</li>
        <li>Storing temporary form state</li>
        <li>Maintaining application state during your session</li>
      </ul>
      <p>
        These storage mechanisms follow similar principles to cookies and can be cleared through
        your browser settings.
      </p>

      <h2>9. Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in our practices
        or for legal reasons. We will post any changes on this page and update the &quot;Last Updated&quot;
        date at the top.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have questions about our use of cookies, please contact us:
      </p>
      <p>
        <strong>EduNode Analytics</strong><br />
        Email: privacy@edunode.com<br />
        Address: 123 Education Way, Suite 400, San Francisco, CA 94105
      </p>
    </LegalPageLayout>
  );
}
