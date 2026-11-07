import type { GemId } from '../../content/types';
import type { Arena } from '../world';
import { compileScheme, findGem, type SchemeSpec } from './scheme';

export { runSchemes } from './runner';
export { MAX_CHAIN_DEPTH } from './scheme';
export { EFFECTS } from './effects';
export type { Scheme, SchemeSpec } from './scheme';

/** Replaces the arena's schemes; cooldowns, counters and waiting effects start fresh. */
export function setArenaSchemes(arena: Arena, specs: readonly SchemeSpec[]): void {
  const schemes = specs.map(compileScheme);
  // Greed slows every other scheme in the arena, once per greedy scheme.
  const penalty = findGem('gem:greed').params?.penalty ?? 1;
  schemes.forEach((scheme, index) => {
    const greedy = specs.filter(
      (spec, other) => other !== index && spec.supports.includes('gem:greed'),
    );
    scheme.cooldownTicks = Math.round(scheme.cooldownTicks * penalty ** greedy.length);
  });
  arena.schemes = schemes;
  arena.pendingEffects = [];
}

/** Puts a law in force in the arena (or none); entropy starts from nothing. */
export function setArenaLaw(arena: Arena, law: GemId | null): void {
  if (arena.law === law) return;
  arena.law = law;
  arena.entropy = 0;
}
