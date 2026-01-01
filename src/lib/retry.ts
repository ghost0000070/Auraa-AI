/**
 * Retry logic for API calls with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (error?.code === 'unavailable' || error?.code === 'internal') {
      return true;
    }
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }
    return false;
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we shouldn't or if this was the last attempt
      if (!opts.shouldRetry(error) || attempt === opts.maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry specifically for Firebase operations
 */
export async function retryFirebaseOperation<T>(
  fn: () => Promise<T>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelay: 1000,
    shouldRetry: (error: any) => {
      // Retry on common Firebase transient errors
      const retryableCodes = [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'internal',
        'unknown',
      ];
      return retryableCodes.includes(error?.code);
    },
  });
}
