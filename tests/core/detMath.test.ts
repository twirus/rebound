import { describe, expect, it } from 'vitest';
import { detAtan2, detCos, detSin } from '../../src/core/detMath';

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

  it('matches Math.atan2 in every quadrant', () => {
    for (let angle = -Math.PI + 0.001; angle < Math.PI; angle += 0.0071) {
      for (const length of [0.3, 1, 250]) {
        const y = Math.sin(angle) * length;
        const x = Math.cos(angle) * length;
        expect(Math.abs(detAtan2(y, x) - Math.atan2(y, x))).toBeLessThan(1e-12);
      }
    }
    expect(detAtan2(0, -1)).toBeCloseTo(Math.PI, 15);
    expect(detAtan2(1, 0)).toBeCloseTo(Math.PI / 2, 15);
  });
});
