import { describe, it, expect } from 'vitest';
import { pointInPoly, buildPathD } from '../lasso';

describe('pointInPoly', () => {
  const square: [number, number][] = [[0,0],[100,0],[100,100],[0,100]];

  it('returns true for a point inside a square', () => {
    expect(pointInPoly(50, 50, square)).toBe(true);
  });

  it('returns false for a point outside a square', () => {
    expect(pointInPoly(150, 50, square)).toBe(false);
  });

  it('returns false for an empty polygon', () => {
    expect(pointInPoly(50, 50, [])).toBe(false);
  });

  it('handles a triangle', () => {
    const tri: [number, number][] = [[0,0],[100,0],[50,100]];
    expect(pointInPoly(50, 50, tri)).toBe(true);
    expect(pointInPoly(5,  90, tri)).toBe(false);
  });

  it('returns false for a point on the far edge', () => {
    expect(pointInPoly(200, 200, square)).toBe(false);
  });
});

describe('buildPathD', () => {
  it('returns empty string for fewer than 2 points', () => {
    expect(buildPathD([])).toBe('');
    expect(buildPathD([[10, 20]])).toBe('');
  });

  it('builds a closed path for 2 points', () => {
    const d = buildPathD([[0,0],[100,0]]);
    expect(d).toMatch(/^M0,0/);
    expect(d).toMatch(/L100,0/);
    expect(d).toMatch(/Z$/);
  });

  it('builds a path for multiple points', () => {
    const pts: [number, number][] = [[0,0],[50,0],[50,50],[0,50]];
    const d = buildPathD(pts);
    expect(d).toContain('M0,0');
    expect(d).toContain('L50,0');
    expect(d).toContain('L50,50');
    expect(d).toContain('L0,50');
    expect(d.endsWith('Z')).toBe(true);
  });
});
