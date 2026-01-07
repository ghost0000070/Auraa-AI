import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeHtml,
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  sanitizeObject,
  RateLimiter,
} from './sanitize';

describe('sanitizeHtml', () => {
  it('escapes HTML special characters', () => {
    const dirty = "<script>alert('x')</script>";
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('&lt;script&gt;alert(&#x27;x&#x27;)&lt;&#x2F;script&gt;');
  });
});

describe('sanitizeInput', () => {
  it('trims, limits length, and removes null bytes', () => {
    const input = '  hello\0world  ';
    const result = sanitizeInput(input, 5);
    expect(result).toBe('hello');
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentionally passing non-string
    expect(sanitizeInput(null)).toBe('');
  });
});

describe('validators', () => {
  it('validates email format', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('bad-email')).toBe(false);
  });

  it('validates URL format', () => {
    expect(isValidUrl('https://auraa.ai')).toBe(true);
    expect(isValidUrl('ftp://auraa.ai')).toBe(false);
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

describe('sanitizeObject', () => {
  it('keeps only allowed keys and sanitizes values', () => {
    const input = {
      name: '  Auraa  ',
      tags: [' one ', 'two'],
      count: 3,
      ignore: 'x',
    };

    const result = sanitizeObject(input, ['name', 'tags', 'count']);
    expect(result).toEqual({
      name: 'Auraa',
      tags: ['one', 'two'],
      count: 3,
    });
  });
});

describe('RateLimiter', () => {
  it('enforces request window and cooldown', () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(2, 1000);

    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(false);
    expect(limiter.getTimeUntilNextRequest()).toBeGreaterThan(0);

    vi.advanceTimersByTime(1000);

    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.getTimeUntilNextRequest()).toBe(0);

    vi.useRealTimers();
  });
});
