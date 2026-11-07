import type { StatDef } from './types';

export const stats: readonly StatDef[] = [
  { id: 'stat:ball-count', nameKey: 'stat.ball-count.name' },
  { id: 'stat:ball-limit', nameKey: 'stat.ball-limit.name' },
  { id: 'stat:impulse-per-hit', nameKey: 'stat.impulse-per-hit.name' },
  { id: 'stat:impulse-per-collision', nameKey: 'stat.impulse-per-collision.name' },
  { id: 'stat:min-bounce-speed', nameKey: 'stat.min-bounce-speed.name' },
  { id: 'stat:arena-scale', nameKey: 'stat.arena-scale.name' },
  { id: 'stat:tap-strength', nameKey: 'stat.tap-strength.name' },
  { id: 'stat:tap-cooldown', nameKey: 'stat.tap-cooldown.name' },
  { id: 'stat:auto-tap', nameKey: 'stat.auto-tap.name' },
  { id: 'stat:auto-tap-interval', nameKey: 'stat.auto-tap-interval.name' },
  { id: 'stat:auto-tap-power', nameKey: 'stat.auto-tap-power.name' },
  { id: 'stat:tap-reach', nameKey: 'stat.tap-reach.name' },
  { id: 'stat:tap-echo', nameKey: 'stat.tap-echo.name' },
  { id: 'stat:impulse-multiplier', nameKey: 'stat.impulse-multiplier.name' },
  { id: 'stat:ring-count', nameKey: 'stat.ring-count.name' },
  { id: 'stat:ring-gap', nameKey: 'stat.ring-gap.name' },
  { id: 'stat:ring-spin', nameKey: 'stat.ring-spin.name' },
  { id: 'stat:shards-per-break', nameKey: 'stat.shards-per-break.name' },
  { id: 'stat:shards-per-escape', nameKey: 'stat.shards-per-escape.name' },
];
