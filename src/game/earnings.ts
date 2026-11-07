import type { SimEventBuffer } from '../sim/events';
import type { Stats } from './stats';

/** Resources earned from one tick of simulation events. Reused between ticks. */
export class TickEarnings {
  impulse = 0;
  shards = 0;
  spectrum = 0;

  collect(events: SimEventBuffer, stats: Stats): void {
    let impulse = 0;
    let shards = 0;
    let spectrum = 0;
    for (let index = 0; index < events.count; index++) {
      switch (events.at(index).kind) {
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
        case 'push':
        case 'round-reset':
        case 'split':
          break;
      }
    }
    this.impulse = impulse * stats['stat:impulse-multiplier'];
    this.shards = shards;
    this.spectrum = spectrum;
  }
}
