import { describe, expect, it } from 'vitest';
import { formatNumber } from '../../src/core/formatNumber';

describe('formatNumber', () => {
  it('groups thousands with a non-breaking space', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(12345)).toBe('12 345');
    expect(formatNumber(1234567.4)).toBe('1 234 567');
  });

  it('keeps the sign', () => {
    expect(formatNumber(-1500)).toBe('-1 500');
  });

  it('shows up to the given decimals and drops trailing zeros', () => {
    expect(formatNumber(18.44, 1)).toBe('18,4');
    expect(formatNumber(18.04, 1)).toBe('18');
    expect(formatNumber(1.25, 2, '.')).toBe('1.25');
    expect(formatNumber(1.999, 1)).toBe('2');
  });
});
