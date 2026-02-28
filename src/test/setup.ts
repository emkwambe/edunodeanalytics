import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('EDUNODE_DEMO_MODE', 'true');

// Global fetch mock
global.fetch = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
