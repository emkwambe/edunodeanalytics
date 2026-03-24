import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from '@/components/providers';
import './globals.css';

// Environment validation (T1 Security)
// Validation is lazy - only triggers at runtime, not build time.
// Import the getEnv function to ensure it's available for runtime validation.
import { getEnv } from '@/lib/env';

// Validate on first page load (server-side)
// getEnv() throws on invalid env, crashing the app with a clear error message
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  getEnv();
}

// Force dynamic rendering for all pages to avoid Clerk build-time errors
// when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not available during static generation
export const dynamic = 'force-dynamic';

// CSS font variables are set in globals.css using system font stack
// This avoids font loading issues in restricted network environments

export const metadata: Metadata = {
  title: {
    default: 'EduNode Analytics',
    template: '%s | EduNode Analytics',
  },
  description:
    'Modern Data Stack as a Service for Independent Charter Schools. FERPA-compliant analytics dashboards for SIS, LMS, and Assessment data.',
  keywords: [
    'education analytics',
    'charter school',
    'student data',
    'FERPA compliant',
    'school dashboard',
    'EdTech SaaS',
  ],
  authors: [{ name: 'EduNode' }],
  creator: 'EduNode',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#1e293b',
          colorInputBackground: '#334155',
          colorInputText: '#f8fafc',
          colorText: '#f8fafc',
          colorTextSecondary: '#94a3b8',
          borderRadius: '0.75rem',
        },
        elements: {
          formButtonPrimary:
            'bg-indigo-500 hover:bg-indigo-600 text-white',
          card: 'bg-slate-800 border border-slate-700',
          headerTitle: 'text-slate-100',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton:
            'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600',
          formFieldLabel: 'text-slate-300',
          formFieldInput:
            'bg-slate-700 border-slate-600 text-slate-100 focus:ring-indigo-500',
          footerActionLink: 'text-indigo-400 hover:text-indigo-300',
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
      >
        <body className="min-h-screen bg-slate-900 font-sans antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
