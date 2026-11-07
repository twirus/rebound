import { describe, expect, it } from 'vitest';
import { hashWorld } from '../../src/sim/hashWorld';
import { queuePush } from '../../src/sim/push';
import { runTicks, worldWithBalls } from './helpers';

const SEED = 12345;
const TICKS = 10_000;
const BALLS = 40;
/**
 * Reference fingerprint. If a deliberate simulation change alters it, update it
 * in the same commit and say so in the commit message.
 */
const REFERENCE_HASH = 'a26a3492';

function runWorld(seed: number): string {
  const { world, arena } = worldWithBalls(seed, BALLS);
  arena.minBounceSpeed = 420;
  runTicks(world, TICKS, () => {
    if (world.tick % 997 === 0) {
      queuePush(world, { arenaIndex: 0, x: 0, y: 150, strength: 600, reach: 120 });
    }
  });
  return hashWorld(world);
}

describe('determinism', () => {
  it('produces the reference state after 10 000 ticks', () => {
    expect(runWorld(SEED)).toBe(REFERENCE_HASH);
  });

  it('gives identical results on repeated runs', () => {
    expect(runWorld(SEED)).toBe(runWorld(SEED));
  });

  it('diverges for a different seed', () => {
    expect(runWorld(SEED + 1)).not.toBe(runWorld(SEED));
  });
});
