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
};

/** A node raising the key stat cannot be bought past the value of the mapped stat. */
export const STAT_CAPS: Readonly<Partial<Record<StatId, StatId>>> = {
  'stat:ball-count': 'stat:ball-limit',
};

/** Tap push fades to zero at this share of the arena radius. */
export const TAP_REACH = 0.55;
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
