import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names conditionally', () => {
    const isHidden = false;
    const result = cn('btn', ['primary', isHidden && 'hidden'], { active: true, disabled: false });
    expect(result).toBe('btn primary active');
  });
});
