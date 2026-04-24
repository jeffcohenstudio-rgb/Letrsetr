import { describe, it, expect } from 'vitest';
import { History } from '../history';

describe('History', () => {
  it('starts empty', () => {
    expect(new History().length).toBe(0);
  });

  it('push and pop a snapshot', () => {
    const h = new History();
    const snap = [{ letter: 'A', left: '10px', top: '20px', rot: 0 }];
    h.push(snap);
    expect(h.length).toBe(1);
    expect(h.pop()).toEqual(snap);
    expect(h.length).toBe(0);
  });

  it('returns undefined when popping empty stack', () => {
    expect(new History().pop()).toBeUndefined();
  });

  it('evicts oldest entry when maxSize is exceeded', () => {
    const h = new History(3);
    h.push([{ letter: 'A', left: '0px', top: '0px', rot: 0 }]);
    h.push([{ letter: 'B', left: '0px', top: '0px', rot: 0 }]);
    h.push([{ letter: 'C', left: '0px', top: '0px', rot: 0 }]);
    h.push([{ letter: 'D', left: '0px', top: '0px', rot: 0 }]);
    expect(h.length).toBe(3);
    // Oldest (A) should have been evicted; latest is D
    expect(h.pop()![0].letter).toBe('D');
    expect(h.pop()![0].letter).toBe('C');
    expect(h.pop()![0].letter).toBe('B');
  });

  it('respects a custom maxSize', () => {
    const h = new History(1);
    expect(h.maxSize).toBe(1);
    h.push([{ letter: 'X', left: '0px', top: '0px', rot: 0 }]);
    h.push([{ letter: 'Y', left: '0px', top: '0px', rot: 0 }]);
    expect(h.length).toBe(1);
    expect(h.pop()![0].letter).toBe('Y');
  });
});
