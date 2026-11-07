import { BallStatus } from '../ball';
import { startStatus } from '../balls/status';
import { pushAround } from '../push';
import type { EffectHandler } from './target';

export const blast: EffectHandler = (target, params, { arena }) => {
  pushAround(arena, target.x, target.y, (params.strength ?? 0) * target.power, params.radius ?? 0);
};

export const repel: EffectHandler = blast;

/** A pull is a push towards the spot. */
export const attract: EffectHandler = (target, params, { arena }) => {
  pushAround(arena, target.x, target.y, -(params.strength ?? 0) * target.power, params.radius ?? 0);
};

export const freeze: EffectHandler = (target, params, { arena }) => {
  const reach = params.radius ?? 0;
  for (const ball of arena.balls) {
    if (ball === target.ball || ball.status !== BallStatus.free || ball.heldTicks > 0) continue;
    if (Math.hypot(ball.x - target.x, ball.y - target.y) >= reach) continue;
    startStatus(ball, BallStatus.frozen, (params.seconds ?? 0) * target.power);
  }
};

/** Stores firings; every N-th lets them all go at once as a huge blast. */
export const charge: EffectHandler = (target, params, context) => {
  const scheme = target.scheme;
  if (!scheme) return;
  scheme.charge += 1;
  if (scheme.charge < (params.count ?? 1)) return;
  scheme.charge = 0;
  const strength = (params.strength ?? 0) * target.power;
  pushAround(context.arena, target.x, target.y, strength, params.radius ?? 0);
  context.events.push('beam', context.arenaIndex, target.x, target.y, strength);
};

export const gravityTurn: EffectHandler = (_target, _params, { arena }) => {
  // A quarter turn clockwise on screen: down becomes left, left becomes up.
  const { gravityX, gravityY } = arena;
  arena.gravityX = -gravityY;
  arena.gravityY = gravityX;
};

/** Plays the arena's previous event again, so every scheme hooked to it fires once more. */
export const repeat: EffectHandler = (target, _params, { arena, arenaIndex, events }) => {
  const previous = target.previous;
  if (!previous) return;
  const ball = arena.balls.find((candidate) => candidate.id === previous.ballId) ?? null;
  events.push(previous.kind, arenaIndex, previous.x, previous.y, previous.strength, ball);
};
