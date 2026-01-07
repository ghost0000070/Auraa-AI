import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names conditionally', () => {
    const result = cn('btn', ['primary', false && 'hidden'], { active: true, disabled: false });
    expect(result).toBe('btn primary active');
  });
});
