import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

beforeEach(() => localStorage.clear());

describe('storage.theme', () => {
  it('returns null when nothing is saved', () => {
    expect(storage.getTheme()).toBeNull();
  });

  it('round-trips theme values', () => {
    storage.setTheme(200, 30, 55);
    expect(storage.getTheme()).toEqual({ h: 200, l: 30, s: 55 });
  });

  it('overwrites a previous theme', () => {
    storage.setTheme(100, 20, 40);
    storage.setTheme(200, 30, 55);
    expect(storage.getTheme()).toEqual({ h: 200, l: 30, s: 55 });
  });
});

describe('storage.tileFilter', () => {
  it('returns null when nothing is saved', () => {
    expect(storage.getTileFilter()).toBeNull();
  });

  it('round-trips tile filter values', () => {
    storage.setTileFilter(90, 1.4, 0.8);
    const f = storage.getTileFilter();
    expect(f).not.toBeNull();
    expect(f!.hr).toBe(90);
    expect(f!.br).toBeCloseTo(1.4);
    expect(f!.sat).toBeCloseTo(0.8);
  });
});

describe('storage.layout', () => {
  it('returns null when nothing is saved', () => {
    expect(storage.getLayout()).toBeNull();
  });

  it('round-trips a layout', () => {
    const layout = {
      size: 60,
      tiles: [
        { letter: 'A', left: '10px', top: '20px', rot: 2.5 },
        { letter: 'B', left: '80px', top: '20px', rot: -1 },
      ],
    };
    storage.setLayout(layout);
    expect(storage.getLayout()).toEqual(layout);
  });
});
