import type { SimEvent } from '../events';
import type { ShapeContext } from '../shapes';
import { passesConditions } from './conditions';
import { fireScheme, runPending } from './firing';
import type { Scheme } from './scheme';

export { MAX_CHAIN_DEPTH } from './scheme';

/** Whether this event makes the scheme fire now (cooldown, depth, conditions, every N-th). */
function triggers(
  scheme: Scheme,
  schemeIndex: number,
  event: SimEvent,
  context: ShapeContext,
): boolean {
  if (scheme.cooldownLeft > 0 || event.scheme === schemeIndex) return false;
  if (event.depth >= scheme.maxDepth || !scheme.listensTo.includes(event.kind)) return false;
  const ball =
    event.ballId < 0
      ? null
      : (context.arena.balls.find((item) => item.id === event.ballId) ?? null);
  if (!passesConditions(scheme.conditions, ball, context.arena)) return false;
  scheme.triggers += 1;
  return scheme.triggers % scheme.every === 0;
}

/**
 * Lands effects that were waiting, then matches this tick's arena events
 * against the schemes, oldest first. Events caused by effects are appended and
 * matched too, up to each scheme's chain depth; a scheme never reacts to events
 * it caused itself.
 */
export function runSchemes(context: ShapeContext, firstEvent: number): void {
  const { arena, arenaIndex, events } = context;
  for (const scheme of arena.schemes) {
    if (scheme.cooldownLeft > 0) scheme.cooldownLeft -= 1;
  }
  if (arena.schemes.length === 0) return;
  runPending(context);
  let previous: SimEvent | null = null;
  for (let index = firstEvent; index < events.count; index++) {
    const event = events.at(index);
    if (event.arenaIndex !== arenaIndex) continue;
    arena.schemes.forEach((scheme, schemeIndex) => {
      if (triggers(scheme, schemeIndex, event, context)) {
        fireScheme(scheme, schemeIndex, event, previous, context);
      }
    });
    previous = event;
  }
  events.depth = 0;
  events.scheme = -1;
}
