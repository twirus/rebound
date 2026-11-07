import type { NodeCost, StatId } from '../content/types';

/** Stat values with nothing bought. Tree nodes add to these (see content/tree.ts). */
export const BASE_STATS: Readonly<Record<StatId, number>> = {
  'stat:ball-count': 1,
  'stat:ball-limit': 6,
  'stat:impulse-per-hit': 1,
  'stat:impulse-per-collision': 0,
  'stat:min-bounce-speed': 0,
  'stat:arena-scale': 1,
  'stat:tap-strength': 450,
  'stat:tap-cooldown': 2,
  'stat:auto-tap': 0,
  'stat:auto-tap-interval': 10,
  'stat:auto-tap-power': 1,
  /** Tap push fades to zero at this share of the arena radius. */
  'stat:tap-reach': 0.55,
  'stat:tap-echo': 0,
  'stat:impulse-multiplier': 1,
  /** Added to the ring count of the Rings shape. */
  'stat:ring-count': 0,
  /** Added to the gap width of every ring, degrees. */
  'stat:ring-gap': 0,
  /** Multiplies how fast the rings spin; slower rings keep their gaps in line longer. */
  'stat:ring-spin': 1,
  'stat:shards-per-break': 1,
  'stat:shards-per-escape': 5,
  /** Added to the share of each side that counts as a corner. */
  'stat:corner-share': 0,
  /** Added to how long a triangle clone lives, seconds. */
  'stat:clone-seconds': 0,
  'stat:impulse-per-corner': 2,
  /** Added to the hits it takes the portal to move (negative: more often). */
  'stat:portal-shift': 0,
  'stat:impulse-per-portal': 3,
  /** Added to the streak a hexagon combo needs (negative: shorter). */
  'stat:combo-length': 0,
  'stat:spectrum-per-combo': 1,
};

/** A node raising the key stat cannot be bought past the value of the mapped stat. */
export const STAT_CAPS: Readonly<Partial<Record<StatId, StatId>>> = {
  'stat:ball-count': 'stat:ball-limit',
};

/** The echo of a tap comes this much later and this much weaker. */
export const TAP_ECHO_DELAY_SECONDS = 0.25;
export const TAP_ECHO_STRENGTH = 0.6;
/** Auto-push comes from the bottom of the arena and reaches this share of the radius. */
export const AUTO_TAP_REACH = 0.8;
/** Auto-push origin below the centre, as a share of the radius. */
export const AUTO_TAP_DEPTH = 0.95;

export const AUTOSAVE_SECONDS = 15;
/** Income per second is averaged over this many seconds. */
export const INCOME_WINDOW_SECONDS = 5;

export function nodePrice(cost: NodeCost, level: number): number {
  return Math.ceil(cost.base * cost.growth ** level);
}
