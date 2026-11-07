import { gems } from '../../content/gems';
import type { GemDef, GemId, SimEventKind } from '../../content/types';
import { TICK_SECONDS } from '../constants';

/** A scheme as the player built it: one event, one effect and some supports. */
export interface SchemeSpec {
  event: GemId;
  effect: GemId;
  supports: readonly GemId[];
}

/** A scheme ready to run in an arena. */
export interface Scheme {
  spec: SchemeSpec;
  listensTo: readonly SimEventKind[];
  effect: GemId;
  cooldownTicks: number;
  cooldownLeft: number;
  /** Multiplier on the effect's numbers (supports and conditions change it). */
  power: number;
  /** Times the scheme has fired since the arena was built. */
  fired: number;
  /** Firings stored up by the charge effect. */
  charge: number;
}

export function findGem(id: GemId): GemDef {
  const gem = gems.find((candidate) => candidate.id === id);
  if (!gem) throw new Error(`Unknown gem ${id}`);
  return gem;
}

export function compileScheme(spec: SchemeSpec): Scheme {
  const event = findGem(spec.event);
  const effect = findGem(spec.effect);
  if (event.kind !== 'event' || effect.kind !== 'effect') {
    throw new Error(`Scheme needs an event and an effect, got ${spec.event} and ${spec.effect}`);
  }
  return {
    spec,
    listensTo: event.listensTo ?? [],
    effect: effect.id,
    cooldownTicks: Math.max(1, Math.round((effect.cooldownSeconds ?? 0) / TICK_SECONDS)),
    cooldownLeft: 0,
    power: 1,
    fired: 0,
    charge: 0,
  };
}
