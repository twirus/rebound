import type { GemId } from '../../content/types';
import type { Ball } from '../ball';
import type { Arena } from '../world';
import { findGem } from './scheme';

type ConditionCheck = (ball: Ball | null, arena: Arena, id: GemId) => boolean;

function averageRadius(arena: Arena): number {
  if (arena.balls.length === 0) return 0;
  return arena.balls.reduce((sum, ball) => sum + ball.radius, 0) / arena.balls.length;
}

/** Narrowing tests by condition gem; rare and every-nth limit timing instead (see supports.ts). */
const CHECKS: Readonly<Partial<Record<GemId, ConditionCheck>>> = {
  'gem:only-color': (ball, _arena, id) => ball?.tint === (findGem(id).params?.count ?? 0),
  'gem:only-half': (ball) => ball !== null && ball.y < 0,
  'gem:only-big': (ball, arena) => ball !== null && ball.radius > averageRadius(arena),
  'gem:only-small': (ball, arena) => ball !== null && ball.radius < averageRadius(arena),
  'gem:only-hot': (ball, _arena, id) =>
    ball !== null && ball.heat >= (findGem(id).params?.strength ?? 0),
};

export function passesConditions(
  conditions: readonly GemId[],
  ball: Ball | null,
  arena: Arena,
): boolean {
  return conditions.every((id) => CHECKS[id]?.(ball, arena, id) ?? true);
}
