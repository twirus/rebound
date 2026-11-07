import type { SimEvent } from '../events';
import type { ShapeContext } from '../shapes';
import { EFFECTS, type EffectTarget } from './effects';
import { findGem, type Scheme } from './scheme';

/** No chain of gem effects goes deeper than this within one tick. */
export const MAX_CHAIN_DEPTH = 8;

const target: EffectTarget = { x: 0, y: 0, ball: null, power: 1, scheme: null, previous: null };

function fire(
  scheme: Scheme,
  schemeIndex: number,
  event: SimEvent,
  previous: SimEvent | null,
  context: ShapeContext,
): void {
  const { arena, events } = context;
  target.x = event.x;
  target.y = event.y;
  target.ball =
    event.ballId < 0 ? null : (arena.balls.find((ball) => ball.id === event.ballId) ?? null);
  target.power = scheme.power;
  target.scheme = scheme;
  target.previous = previous;
  // Whatever the effect causes belongs to this scheme, one link deeper in the chain.
  events.depth = event.depth + 1;
  events.scheme = schemeIndex;
  EFFECTS[scheme.effect]?.(target, findGem(scheme.effect).params ?? {}, context);
  scheme.cooldownLeft = scheme.cooldownTicks;
  scheme.fired += 1;
}

/**
 * Matches this tick's arena events against the arena's schemes, oldest event
 * first. Events caused by effects are appended and matched too, up to the
 * chain depth limit; a scheme never reacts to events it caused itself.
 */
export function runSchemes(context: ShapeContext, firstEvent: number): void {
  const { arena, arenaIndex, events } = context;
  for (const scheme of arena.schemes) {
    if (scheme.cooldownLeft > 0) scheme.cooldownLeft -= 1;
  }
  if (arena.schemes.length === 0) return;
  let previous: SimEvent | null = null;
  for (let index = firstEvent; index < events.count; index++) {
    const event = events.at(index);
    if (event.arenaIndex !== arenaIndex) continue;
    if (event.depth < MAX_CHAIN_DEPTH) {
      arena.schemes.forEach((scheme, schemeIndex) => {
        if (scheme.cooldownLeft > 0 || event.scheme === schemeIndex) return;
        if (!scheme.listensTo.includes(event.kind)) return;
        fire(scheme, schemeIndex, event, previous, context);
      });
    }
    previous = event;
  }
  events.depth = 0;
  events.scheme = -1;
}
