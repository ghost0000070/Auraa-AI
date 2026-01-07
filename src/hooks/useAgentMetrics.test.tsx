import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Create mock before vi.mock calls (hoisting workaround)
const mockFrom = vi.fn();

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-123' },
  })),
}));

// Mock supabase - use factory function that references the hoisted mock
vi.mock('@/supabase', () => ({
  supabase: {
    get from() {
      return mockFrom;
    },
  },
}));

// Import after mocks are set up
import { useAgentMetrics } from './useAgentMetrics';

describe('useAgentMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
            })),
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useAgentMetrics());
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches metrics from agent_tasks when agent_metrics is empty', async () => {
    // First call for agent_metrics returns empty
    mockFrom.mockImplementation((table: string) => {
      if (table === 'agent_metrics') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                })),
              })),
            })),
          })),
        };
      }
      // agent_tasks fallback
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              { status: 'completed', started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:00:10Z' },
              { status: 'completed', started_at: '2026-01-01T00:01:00Z', finished_at: '2026-01-01T00:01:05Z' },
              { status: 'failed', started_at: null, finished_at: null },
              { status: 'pending', started_at: null, finished_at: null },
            ],
            error: null,
          }),
        })),
      };
    });

    const { result } = renderHook(() => useAgentMetrics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      totalTasks: 4,
      completedTasks: 2,
      failedTasks: 1,
      pendingTasks: 1,
      successRate: 50,
      avgResponseTime: 7.5, // (10 + 5) / 2
    });
  });

  it('provides refetch function', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
            })),
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useAgentMetrics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
