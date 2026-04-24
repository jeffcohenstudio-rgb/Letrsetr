import { describe, it, expect } from 'vitest';
import { separateTiles } from '../separation';

function makeTileEl(x: number, y: number): HTMLElement {
  const el = document.createElement('div');
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  return el;
}

describe('separateTiles', () => {
  const SZ = 60, W = 800, H = 600;

  it('returns true for a single tile', () => {
    expect(separateTiles([makeTileEl(100, 100)], SZ, W, H, false)).toBe(true);
  });

  it('returns true for an empty tile list', () => {
    expect(separateTiles([], SZ, W, H, false)).toBe(true);
  });

  it('separates two coincident tiles', () => {
    const a = makeTileEl(100, 100);
    const b = makeTileEl(100, 100);
    const ok = separateTiles([a, b], SZ, W, H, false);
    expect(ok).toBe(true);
    const ax = parseFloat(a.style.left), bx = parseFloat(b.style.left);
    const ay = parseFloat(a.style.top),  by = parseFloat(b.style.top);
    const dist = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
    expect(dist).toBeGreaterThanOrEqual(SZ + 4 - 2);
  });

  it('does not move tiles that are already separated', () => {
    const a = makeTileEl(0,   0);
    const b = makeTileEl(200, 0);
    separateTiles([a, b], SZ, W, H, false);
    expect(parseFloat(a.style.left)).toBeCloseTo(0);
    expect(parseFloat(b.style.left)).toBeCloseTo(200);
  });

  it('snaps tiles to grid when snapEnabled', () => {
    const a = makeTileEl(0,   0);
    const b = makeTileEl(300, 0);
    separateTiles([a, b], SZ, W, H, true);
    const grid = SZ + 4;
    expect(parseFloat(a.style.left) % grid).toBeCloseTo(0);
    expect(parseFloat(b.style.left) % grid).toBeCloseTo(0);
  });

  it('clamps tiles within board bounds', () => {
    const a = makeTileEl(-50, -50);
    separateTiles([a], SZ, W, H, false);
    expect(parseFloat(a.style.left)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(a.style.top)).toBeGreaterThanOrEqual(0);
  });
});
