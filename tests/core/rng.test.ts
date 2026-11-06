import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/core/rng';

describe('Rng', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = new Rng(42);
    const second = new Rng(42);
    for (let index = 0; index < 100; index++) {
      expect(first.nextFloat()).toBe(second.nextFloat());
    }
  });

  it('stays within [0, 1)', () => {
    const rng = new Rng(7);
    for (let index = 0; index < 10_000; index++) {
      const value = rng.nextFloat();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('gives different sequences for different seeds', () => {
    expect(new Rng(1).nextFloat()).not.toBe(new Rng(2).nextFloat());
  });
});
