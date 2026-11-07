import { detCos, detSin } from '../../core/detMath';
import { BallStatus, resizeBall, type Ball } from '../ball';
import { startStatus } from '../balls/status';
import { TICK_SECONDS } from '../constants';
import { shapeSpawnRadius } from '../shapes';
import { respawnNearCentre } from '../shapes/walls';
import { spawnClone } from '../world';
import { targetBall, type EffectHandler } from './target';

/** A split copy flies off this far (radians) from the original's direction. */
const SPLIT_ANGLE = 0.4;
const SPLIT_COS = detCos(SPLIT_ANGLE);
const SPLIT_SIN = detSin(SPLIT_ANGLE);
/** Copies made by gems alive at once in one arena. */
const MAX_GEM_CLONES = 20;
/** A merged ball grows by this share of its size. */
const MERGE_GROWTH = 0.1;
const MAX_SIZE = 2;
/** Teleports land within this share of the free space around the centre. */
const TELEPORT_SHARE = 0.8;
/** Balls that merged away come back near the centre, within this share of the radius. */
const RESPAWN_SHARE = 0.3;
const RESPAWN_SPEED = 160;

function sizeOf(ball: Ball): number {
  return ball.baseRadius > 0 ? ball.radius / ball.baseRadius : 1;
}

export const split: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (!ball || ball.clone) return;
  const { world, arena, arenaIndex, events } = context;
  const vx = ball.vx * SPLIT_COS - ball.vy * SPLIT_SIN;
  const vy = ball.vx * SPLIT_SIN + ball.vy * SPLIT_COS;
  const life = Math.round(((params.seconds ?? 0) * target.power) / TICK_SECONDS);
  const clone = spawnClone(world, arena, ball, vx, vy, life, MAX_GEM_CLONES);
  if (clone) events.push('spawn', arenaIndex, clone.x, clone.y, 0, clone);
};

export const merge: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  const { arena, arenaIndex, events, rng } = context;
  let nearest: Ball | null = null;
  let best = params.radius ?? 0;
  for (const other of arena.balls) {
    if (other === ball || other.heldTicks > 0) continue;
    const distance = Math.hypot(other.x - ball.x, other.y - ball.y);
    if (distance < best) {
      best = distance;
      nearest = other;
    }
  }
  if (!nearest) return;
  respawnNearCentre(nearest, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
  resizeBall(ball, Math.min(MAX_SIZE, sizeOf(ball) * (1 + MERGE_GROWTH * target.power)));
  events.push('merge', arenaIndex, ball.x, ball.y, ball.radius, ball);
};

export const teleport: EffectHandler = (target, _params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  const { arena, rng } = context;
  const spread = shapeSpawnRadius(arena.shape, arena.radius) * TELEPORT_SHARE;
  ball.x = rng.nextRange(-spread, spread) * Math.SQRT1_2;
  ball.y = rng.nextRange(-spread, spread) * Math.SQRT1_2;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
};

export const swap: EffectHandler = (target, _params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  let farthest: Ball | null = null;
  let best = 0;
  for (const other of context.arena.balls) {
    const distance = Math.hypot(other.x - ball.x, other.y - ball.y);
    if (other !== ball && other.heldTicks === 0 && distance > best) {
      best = distance;
      farthest = other;
    }
  }
  if (!farthest) return;
  const { x, y } = ball;
  ball.x = farthest.x;
  ball.y = farthest.y;
  farthest.x = x;
  farthest.y = y;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  farthest.prevX = x;
  farthest.prevY = y;
};

export const heat: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (ball) ball.heat += (params.strength ?? 0) * target.power;
};

export const recolor: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  const colors = params.count ?? 1;
  ball.tint = (ball.tint + 1 + colors) % colors;
  context.events.push('recolor', context.arenaIndex, ball.x, ball.y, ball.tint, ball);
};

export const reverse: EffectHandler = (target, _params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  ball.vx = -ball.vx;
  ball.vy = -ball.vy;
};

export const grow: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  const limit = params.multiplier ?? 1;
  const size = Math.min(limit, sizeOf(ball) * (1 + (params.strength ?? 0) * target.power));
  resizeBall(ball, size);
  if (size >= limit)
    context.events.push('max-size', context.arenaIndex, ball.x, ball.y, size, ball);
};

export const shrink: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (!ball) return;
  const limit = params.multiplier ?? 1;
  resizeBall(ball, Math.max(limit, sizeOf(ball) * (1 - (params.strength ?? 0) * target.power)));
};

export const petrify: EffectHandler = (target, params, context) => {
  const ball = targetBall(target, context);
  if (!ball || ball.status !== BallStatus.free || ball.heldTicks > 0) return;
  startStatus(ball, BallStatus.frozen, (params.seconds ?? 0) * target.power);
};
