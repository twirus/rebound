import type { GemParams } from '../../content/types';
import type { Ball } from '../ball';
import type { SimEvent } from '../events';
import type { ShapeContext } from '../shapes';
import type { Scheme } from './scheme';

/** Where and on whom an effect lands. Reused between firings, never stored. */
export interface EffectTarget {
  x: number;
  y: number;
  /** The ball that caused the event, null for arena-wide events like "quiet". */
  ball: Ball | null;
  /** Multiplier on the effect's numbers. */
  power: number;
  scheme: Scheme | null;
  /** The arena event just before the one that fired the scheme. */
  previous: SimEvent | null;
}

export type EffectHandler = (
  target: EffectTarget,
  params: GemParams,
  context: ShapeContext,
) => void;

/** The event's own ball, or a random ball when the event had none (quiet, tap). */
export function targetBall(target: EffectTarget, { arena, rng }: ShapeContext): Ball | null {
  if (target.ball) return target.ball;
  if (arena.balls.length === 0) return null;
  const index = Math.min(arena.balls.length - 1, Math.floor(rng.nextFloat() * arena.balls.length));
  return arena.balls[index] ?? null;
}
