import type { SimEventBuffer } from '../sim/events';
import type { Stats } from './stats';

/** Resources earned from one tick of simulation events. Reused between ticks. */
export class TickEarnings {
  impulse = 0;
  shards = 0;
  spectrum = 0;
  mass = 0;
  chronos = 0;

  collect(events: SimEventBuffer, stats: Stats): void {
    let impulse = 0;
    let shards = 0;
    let spectrum = 0;
    let mass = 0;
    let chronos = 0;
    for (let index = 0; index < events.count; index++) {
      const event = events.at(index);
      switch (event.kind) {
        case 'wall-hit':
          impulse += stats['stat:impulse-per-hit'];
          break;
        case 'ball-collision':
          impulse += stats['stat:impulse-per-collision'];
          break;
        case 'corner-hit':
          impulse += stats['stat:impulse-per-corner'];
          break;
        case 'portal':
          impulse += stats['stat:impulse-per-portal'];
          break;
        case 'ring-break':
          shards += stats['stat:shards-per-break'];
          break;
        case 'escape':
          shards += stats['stat:shards-per-escape'];
          break;
        case 'combo':
          spectrum += stats['stat:spectrum-per-combo'];
          break;
        case 'tile-break':
          // The event strength carries the tile's reward multiplier.
          shards += stats['stat:shards-per-tile'] * event.strength;
          break;
        case 'core-reach':
          chronos += stats['stat:chronos-per-core'];
          break;
        case 'merge':
          mass += stats['stat:mass-per-merge'];
          break;
        case 'launch':
        case 'push':
        case 'round-reset':
        case 'split':
          break;
      }
    }
    this.impulse = impulse * stats['stat:impulse-multiplier'];
    this.shards = shards;
    this.spectrum = spectrum;
    this.mass = mass;
    this.chronos = chronos;
  }
}
