import { resources } from '../content/resources';
import type { GemId, GemParams } from '../content/types';
import { permanentBallCount } from '../sim/clones';
import { TICK_SECONDS } from '../sim/constants';
import type { SimEventBuffer } from '../sim/events';
import { findGem } from '../sim/gems/scheme';
import { respawnNearCentre } from '../sim/shapes/walls';
import type { Arena, World } from '../sim/world';
import { emptyResources, type ResourceTable } from './state';

/** Entropy income tops out at this multiplier, just before the collapse. */
const ENTROPY_PEAK_INCOME = 3;
/** Collapsed balls come back near the centre, within this share of the radius. */
const SCATTER_SHARE = 0.4;
const SCATTER_SPEED = 400;

function hadCollision(events: SimEventBuffer): boolean {
  for (let index = 0; index < events.count; index++) {
    if (events.at(index).kind === 'ball-collision') return true;
  }
  return false;
}

/**
 * Laws that change what the arena earns rather than how it moves: egoist,
 * debt and entropy. Keeps their banks between ticks.
 */
export class LawEconomy {
  private readonly bank: ResourceTable = emptyResources();
  private ticksWithoutCollision = 0;
  private entropy = 0;

  /** The player did something: entropy starts over. */
  touch(): void {
    this.entropy = 0;
    this.clearBank();
  }

  /** Changes this tick's `amounts` in place according to the arena law. */
  apply(law: GemId | null, amounts: ResourceTable, world: World, arena: Arena): void {
    const params = law ? (findGem(law).params ?? {}) : {};
    if (law === 'law:egoist' && permanentBallCount(arena) === 1) {
      this.scale(amounts, params.multiplier ?? 1);
    } else if (law === 'law:debt') {
      this.applyDebt(amounts, params, world.events);
    } else if (law === 'law:entropy') {
      this.applyEntropy(amounts, params, world, arena);
    }
    arena.entropy = law === 'law:entropy' ? this.entropy : 0;
  }

  private scale(amounts: ResourceTable, factor: number): void {
    for (const resource of resources) amounts[resource.id] = (amounts[resource.id] ?? 0) * factor;
  }

  private clearBank(): void {
    for (const resource of resources) this.bank[resource.id] = 0;
  }

  /** Earnings go into the bank; a collision pays it out with interest; a long dry spell loses it. */
  private applyDebt(amounts: ResourceTable, params: GemParams, events: SimEventBuffer): void {
    for (const resource of resources) {
      this.bank[resource.id] = (this.bank[resource.id] ?? 0) + (amounts[resource.id] ?? 0);
      amounts[resource.id] = 0;
    }
    if (hadCollision(events)) {
      for (const resource of resources) {
        amounts[resource.id] = (this.bank[resource.id] ?? 0) * (params.multiplier ?? 1);
      }
      this.clearBank();
      this.ticksWithoutCollision = 0;
      return;
    }
    this.ticksWithoutCollision += 1;
    if (this.ticksWithoutCollision * TICK_SECONDS >= (params.seconds ?? 0)) this.clearBank();
  }

  /** Income climbs while untouched; the extra is banked and paid many times over at the collapse. */
  private applyEntropy(
    amounts: ResourceTable,
    params: GemParams,
    world: World,
    arena: Arena,
  ): void {
    this.entropy = Math.min(1, this.entropy + TICK_SECONDS / (params.seconds ?? 1));
    const boost = 1 + this.entropy * (ENTROPY_PEAK_INCOME - 1);
    for (const resource of resources) {
      const base = amounts[resource.id] ?? 0;
      amounts[resource.id] = base * boost;
      this.bank[resource.id] = (this.bank[resource.id] ?? 0) + base * (boost - 1);
    }
    if (this.entropy < 1) return;
    for (const resource of resources) {
      amounts[resource.id] =
        (amounts[resource.id] ?? 0) + (this.bank[resource.id] ?? 0) * (params.multiplier ?? 1);
    }
    for (const ball of arena.balls) {
      respawnNearCentre(ball, arena.radius * SCATTER_SHARE, SCATTER_SPEED, world.rng);
    }
    this.entropy = 0;
    this.clearBank();
  }
}
