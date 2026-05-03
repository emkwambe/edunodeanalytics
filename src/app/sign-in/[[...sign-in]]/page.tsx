import { SignIn } from '@clerk/nextjs';

/**
 * Sign In Page
 *
 * Uses Clerk's pre-built sign-in component with custom styling
 */

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold">E</span>
          </div>
          <span className="text-xl font-semibold text-slate-100">
            EduNode Analytics
          </span>
        </div>

        {/* Sign In Form */}
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-slate-800 border border-slate-700 shadow-xl',
              headerTitle: 'text-slate-100',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton:
                'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600',
              dividerLine: 'bg-slate-700',
              dividerText: 'text-slate-500',
              formFieldLabel: 'text-slate-300',
              formFieldInput:
                'bg-slate-700 border-slate-600 text-slate-100 focus:ring-indigo-500',
              formButtonPrimary:
                'bg-indigo-500 hover:bg-indigo-600 text-white',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
              identityPreviewEditButton: 'text-indigo-400',
            },
          }}
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/select-school"
        />

        {/* Demo access */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Want to explore?{' '}
            <a
              href="/academy-charter/dashboard"
              className="text-indigo-400 hover:text-indigo-300"
            >
              View demo dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Sign In',
};
