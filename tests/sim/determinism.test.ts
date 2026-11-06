import { describe, expect, it } from 'vitest';
import { hashWorld } from '../../src/sim/hashWorld';
import { stepWorld } from '../../src/sim/step';
import { createWorld } from '../../src/sim/world';

const SEED = 12345;
const TICKS = 10_000;
/**
 * Reference fingerprint. If a deliberate simulation change alters it, update it
 * in the same commit and say so in the commit message.
 */
const REFERENCE_HASH = 'caefa4c1';

function runWorld(seed: number, ticks: number): string {
  const world = createWorld(seed);
  for (let tick = 0; tick < ticks; tick++) stepWorld(world);
  return hashWorld(world);
}

describe('determinism', () => {
  it('produces the reference state after 10 000 ticks', () => {
    expect(runWorld(SEED, TICKS)).toBe(REFERENCE_HASH);
  });

  it('gives identical results on repeated runs', () => {
    expect(runWorld(SEED, TICKS)).toBe(runWorld(SEED, TICKS));
  });

  it('diverges for a different seed', () => {
    expect(runWorld(SEED + 1, TICKS)).not.toBe(runWorld(SEED, TICKS));
  });
});
