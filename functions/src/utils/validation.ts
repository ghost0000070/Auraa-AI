/**
 * Input validation and sanitization for Cloud Functions
 */

/**
 * Sanitize string input
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  let sanitized = input.trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\0\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Validate email format
 */
export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Validate URL format
 */
export function validateUrl(url: unknown): string {
  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must use HTTP or HTTPS protocol');
    }
    return parsed.href;
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Validate and sanitize object with allowed keys
 */
export function sanitizeObject<T extends Record<string, any>>(
  input: unknown,
  allowedKeys: string[]
): Partial<T> {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Input must be an object');
  }
  
  const sanitized: Partial<T> = {};
  const obj = input as Record<string, any>;
  
  for (const key of allowedKeys) {
    if (key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key as keyof T] = sanitizeString(value) as any;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key as keyof T] = value as any;
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map(item =>
          typeof item === 'string' ? sanitizeString(item) : item
        ) as any;
      }
    }
  }
  
  return sanitized;
}
