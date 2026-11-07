import { balls } from '../content/balls';
import { resources } from '../content/resources';
import type { GemId, ResourceId, StatId } from '../content/types';
import { findGem } from '../sim/gems/scheme';
import type { SimEventBuffer, SimEventKind } from '../sim/events';
import type { ResourceTable } from './state';
import { emptyResources } from './state';
import type { Stats } from './stats';

interface Reward {
  resource: ResourceId;
  /** Amount per event. */
  stat: StatId;
  /** The event's strength carries a multiplier (e.g. a rich mosaic tile). */
  scaledByStrength?: boolean;
}

/** What each simulation event pays. Events not listed pay nothing. */
const REWARDS: Partial<Record<SimEventKind, Reward>> = {
  'wall-hit': { resource: 'resource:impulse', stat: 'stat:impulse-per-hit' },
  'ball-collision': { resource: 'resource:impulse', stat: 'stat:impulse-per-collision' },
  'corner-hit': { resource: 'resource:impulse', stat: 'stat:impulse-per-corner' },
  portal: { resource: 'resource:impulse', stat: 'stat:impulse-per-portal' },
  'ring-break': { resource: 'resource:shards', stat: 'stat:shards-per-break' },
  escape: { resource: 'resource:shards', stat: 'stat:shards-per-escape' },
  'tile-break': {
    resource: 'resource:shards',
    stat: 'stat:shards-per-tile',
    scaledByStrength: true,
  },
  combo: { resource: 'resource:spectrum', stat: 'stat:spectrum-per-combo' },
  merge: { resource: 'resource:mass', stat: 'stat:mass-per-merge' },
  'core-reach': { resource: 'resource:chronos', stat: 'stat:chronos-per-core' },
};

/** Reward multiplier of each ball type (heavy pays double, void nothing). */
const REWARD_SCALE = new Map(balls.map((ball) => [ball.id, ball.rewardScale ?? 1]));

/** Impulse from every source is multiplied by this stat. */
const IMPULSE: ResourceId = 'resource:impulse';

export interface HotBonus {
  heat: number;
  multiplier: number;
}

/** The thermodynamics law pays more for red-hot balls; other laws pay nothing extra. */
export function hotBonus(law: GemId | null): HotBonus | null {
  if (law !== 'law:thermo') return null;
  const params = findGem(law).params ?? {};
  return { heat: params.count ?? 0, multiplier: params.multiplier ?? 1 };
}

/** Resources earned from one tick of simulation events. Reused between ticks. */
export class TickEarnings {
  readonly amounts: ResourceTable = emptyResources();

  /**
   * `schemeRewards` scales what each arena scheme caused (greed doubles its own);
   * `hot` pays extra for events of balls at least that hot (thermodynamics).
   */
  collect(
    events: SimEventBuffer,
    stats: Stats,
    schemeRewards: readonly { rewardScale: number }[] = [],
    hot: HotBonus | null = null,
  ): void {
    for (const resource of resources) this.amounts[resource.id] = 0;
    for (let index = 0; index < events.count; index++) {
      const event = events.at(index);
      const reward = REWARDS[event.kind];
      if (!reward) continue;
      const byType = event.ballType ? (REWARD_SCALE.get(event.ballType) ?? 1) : 1;
      const byScheme = schemeRewards[event.scheme]?.rewardScale ?? 1;
      const byHeat = hot && event.heat >= hot.heat ? hot.multiplier : 1;
      const amount =
        stats[reward.stat] *
        (reward.scaledByStrength ? event.strength : 1) *
        byType *
        byScheme *
        byHeat;
      this.amounts[reward.resource] = (this.amounts[reward.resource] ?? 0) + amount;
    }
    this.amounts[IMPULSE] = (this.amounts[IMPULSE] ?? 0) * stats['stat:impulse-multiplier'];
  }
}
