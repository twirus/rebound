import { gems } from '../../content/gems';
import type { GemDef, GemId, SimEventKind } from '../../content/types';
import { TICK_SECONDS } from '../constants';
import { applySupport } from './supports';

/** A scheme as the player built it: one event, one effect and some supports. */
export interface SchemeSpec {
  event: GemId;
  effect: GemId;
  supports: readonly GemId[];
}

/** No chain of gem effects goes deeper than this within one tick (sturdy schemes reach further). */
export const MAX_CHAIN_DEPTH = 8;

/** A scheme ready to run in an arena, with everything its supports changed. */
export interface Scheme {
  spec: SchemeSpec;
  listensTo: readonly SimEventKind[];
  effect: GemId;
  cooldownTicks: number;
  cooldownLeft: number;
  /** Multiplier on the effect's numbers. */
  power: number;
  /** Times the scheme has fired since the arena was built. */
  fired: number;
  /** Firings stored up by the charge effect. */
  charge: number;
  /** Deepest chain link this scheme still reacts to. */
  maxDepth: number;
  /** Multiplier on resources earned from events this scheme caused. */
  rewardScale: number;
  /** Ticks the effect waits before it lands (delay). */
  delayTicks: number;
  /** A weaker repeat after this many ticks (echo); 0 for none. */
  echoTicks: number;
  echoPower: number;
  /** Jumps to the nearest other ball (chain). */
  chainJumps: number;
  chainTicks: number;
  chainRadius: number;
  /** Every ball within this radius gets the effect at `areaPower` (area); 0 for one target. */
  areaRadius: number;
  areaPower: number;
  /** A ball this scheme fires on this many times vanishes (fragile); 0 for never. */
  fragileLimit: number;
  /** Always lands on the largest ball (focus). */
  focus: boolean;
  /** Borrows a random other scheme's effect each time (chance). */
  chance: boolean;
  /** Power gained per firing, and the pause once it has doubled (overheat). */
  overheatStep: number;
  overheatPauseTicks: number;
  /** Firings since the last overheat pause. */
  heat: number;
  /** Condition gems a firing must pass. */
  conditions: GemId[];
  /** Only every N-th trigger fires (every-nth); 1 for every trigger. */
  every: number;
  triggers: number;
}

export function findGem(id: GemId): GemDef {
  const gem = gems.find((candidate) => candidate.id === id);
  if (!gem) throw new Error(`Unknown gem ${id}`);
  return gem;
}

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds / TICK_SECONDS);
}

export function compileScheme(spec: SchemeSpec): Scheme {
  const event = findGem(spec.event);
  const effect = findGem(spec.effect);
  if (event.kind !== 'event' || effect.kind !== 'effect') {
    throw new Error(`Scheme needs an event and an effect, got ${spec.event} and ${spec.effect}`);
  }
  const scheme: Scheme = {
    spec,
    listensTo: event.listensTo ?? [],
    effect: effect.id,
    cooldownTicks: secondsToTicks(effect.cooldownSeconds ?? 0),
    cooldownLeft: 0,
    power: 1,
    fired: 0,
    charge: 0,
    maxDepth: MAX_CHAIN_DEPTH,
    rewardScale: 1,
    delayTicks: 0,
    echoTicks: 0,
    echoPower: 0,
    chainJumps: 0,
    chainTicks: 0,
    chainRadius: 0,
    areaRadius: 0,
    areaPower: 1,
    fragileLimit: 0,
    focus: false,
    chance: false,
    overheatStep: 0,
    overheatPauseTicks: 0,
    heat: 0,
    conditions: [],
    every: 1,
    triggers: 0,
  };
  spec.supports.forEach((id, index) => applySupport(scheme, id, spec.supports, index));
  scheme.cooldownTicks = Math.max(1, Math.round(scheme.cooldownTicks));
  return scheme;
}
