import type { Arena } from '../world';
import { compileScheme, type SchemeSpec } from './scheme';

export { runSchemes, MAX_CHAIN_DEPTH } from './runner';
export { EFFECTS } from './effects';
export type { Scheme, SchemeSpec } from './scheme';

/** Replaces the arena's schemes; cooldowns and counters start fresh. */
export function setArenaSchemes(arena: Arena, specs: readonly SchemeSpec[]): void {
  arena.schemes = specs.map(compileScheme);
}
