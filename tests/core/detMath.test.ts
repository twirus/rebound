import { describe, expect, it } from 'vitest';
import { detCos, detSin } from '../../src/core/detMath';

describe('deterministic trigonometry', () => {
  it('matches Math.sin and Math.cos closely over several turns', () => {
    for (let angle = -20; angle <= 20; angle += 0.0137) {
      expect(Math.abs(detSin(angle) - Math.sin(angle))).toBeLessThan(1e-12);
      expect(Math.abs(detCos(angle) - Math.cos(angle))).toBeLessThan(1e-12);
    }
  });

  it('hits the exact values at quarter turns', () => {
    expect(detSin(0)).toBe(0);
    expect(detCos(0)).toBe(1);
    expect(detSin(Math.PI / 2)).toBeCloseTo(1, 15);
  });
});
