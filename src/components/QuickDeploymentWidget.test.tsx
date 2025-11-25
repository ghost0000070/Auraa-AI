
import { render, screen } from '@testing-library/react';
import { QuickDeploymentWidget } from './QuickDeploymentWidget';
import { AuthProvider } from '../hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock firebase modules
vi.mock('@/firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('firebase/auth', async () => {
    const actual = await vi.importActual('firebase/auth');
    return {
        ...(actual as Record<string, unknown>),
        onAuthStateChanged: vi.fn((auth, callback) => {
            // Simulate a logged-in user
            callback({ uid: 'test-user' });
            return () => {}; // Return an unsubscribe function
        }),
    };
});

vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...(actual as Record<string, unknown>),
        getDoc: vi.fn(() => Promise.resolve({
            exists: () => true,
            data: () => ({
                is_active: true,
                plan: 'premium',
                current_period_end: '2025-12-31',
                role: 'user',
            }),
        })),
        doc: vi.fn(),
        query: vi.fn(),
        collection: vi.fn(),
        getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
        onSnapshot: vi.fn(() => () => {}), // Mock onSnapshot to return an unsubscribe function

    };
});

test('renders QuickDeploymentWidget', async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <QuickDeploymentWidget />
      </AuthProvider>
    </BrowserRouter>
  );
  const linkElement = await screen.findByText(/Quick Deploy/i);
  expect(linkElement).toBeInTheDocument();
});
