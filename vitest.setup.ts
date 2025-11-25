import { vi } from 'vitest';

vi.mock('@firebase/analytics', () => ({
  getAnalytics: vi.fn(),
}));

vi.mock('@firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('./src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    subscriptionStatus: null,
    signOut: vi.fn(),
  }),
}));
