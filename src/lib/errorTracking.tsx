/**
 * Error tracking and monitoring utilities
 * Integrates with Sentry for production error tracking
 */

import { SENTRY_CONFIG } from '@/config/constants';

interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorTracker {
  private initialized = false;

  /**
   * Initialize error tracking
   * This should be called once at app startup
   */
  async init() {
    if (!SENTRY_CONFIG.ENABLED || this.initialized) {
      console.log('[ErrorTracker] Sentry disabled or already initialized');
      return;
    }

    try {
      // Dynamically import Sentry to avoid bundling if not needed
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: SENTRY_CONFIG.DSN,
        environment: SENTRY_CONFIG.ENVIRONMENT,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Performance Monitoring
        tracesSampleRate: SENTRY_CONFIG.ENVIRONMENT === 'production' ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // Only send errors in production
        beforeSend(event, _hint) {
          // Filter out non-critical errors in development
          if (SENTRY_CONFIG.ENVIRONMENT === 'development') {
            return null;
          }
          return event;
        },
      });

      this.initialized = true;
      console.log('[ErrorTracker] Sentry initialized');
    } catch (error) {
      console.error('[ErrorTracker] Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, context?: ErrorContext) {
    if (SENTRY_CONFIG.ENABLED && this.initialized) {
      import('@sentry/react').then(Sentry => {
        if (context?.user) {
          Sentry.setUser(context.user);
        }
        if (context?.tags) {
          Sentry.setTags(context.tags);
        }
        if (context?.extra) {
          Sentry.setContext('additional', context.extra);
        }
        Sentry.captureException(error);
      });
    } else {
      // Fallback to console in development
      console.error('[ErrorTracker]', error, context);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (SENTRY_CONFIG.ENABLED && this.initialized) {
      import('@sentry/react').then(Sentry => {
        Sentry.captureMessage(message, level);
      });
    } else {
      console.log(`[ErrorTracker] ${level.toUpperCase()}:`, message);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string }) {
    if (SENTRY_CONFIG.ENABLED && this.initialized) {
      import('@sentry/react').then(Sentry => {
        Sentry.setUser(user);
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (SENTRY_CONFIG.ENABLED && this.initialized) {
      import('@sentry/react').then(Sentry => {
        Sentry.setUser(null);
      });
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

/**
 * React Error Boundary fallback component
 */
export function ErrorFallback({ error }: { error: Error }): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6 border border-border">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-muted-foreground mb-4">
          We&apos;re sorry, but something unexpected happened. Our team has been notified and we&apos;re working on a fix.
        </p>
        {SENTRY_CONFIG.ENVIRONMENT === 'development' && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 text-xs bg-secondary p-2 rounded overflow-auto text-foreground">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
