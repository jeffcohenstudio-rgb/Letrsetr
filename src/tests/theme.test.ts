import { describe, it, expect } from 'vitest';
import { getTileFilter } from '../theme';

describe('getTileFilter', () => {
  it('returns a CSS filter string', () => {
    expect(getTileFilter(0, 1, 1)).toBe('hue-rotate(0deg) brightness(1) saturate(1)');
  });

  it('includes the provided values', () => {
    const f = getTileFilter(90, 1.5, 0.8);
    expect(f).toContain('hue-rotate(90deg)');
    expect(f).toContain('brightness(1.5)');
    expect(f).toContain('saturate(0.8)');
  });
});
