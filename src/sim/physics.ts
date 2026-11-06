import { collideBalls } from './collisions';
import {
  BASE_GRAVITY,
  MAX_BALL_SPEED,
  MAX_SUBSTEPS,
  MAX_TRAVEL_PER_SUBSTEP,
  TICK_SECONDS,
} from './constants';
import type { SimEventBuffer } from './events';
import type { Arena, Ball } from './world';

/*
 * Only + - * / and Math.sqrt are used in sim/: they are exactly specified by
 * IEEE 754, unlike Math.sin/exp, so results match across engines.
 */

export function limitSpeed(ball: Ball, maxSpeed: number): void {
  const speedSquared = ball.vx * ball.vx + ball.vy * ball.vy;
  if (speedSquared <= maxSpeed * maxSpeed) return;
  const factor = maxSpeed / Math.sqrt(speedSquared);
  ball.vx *= factor;
  ball.vy *= factor;
}

function kickToMinSpeed(ball: Ball, minSpeed: number): void {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed === 0 || speed >= minSpeed) return;
  const factor = minSpeed / speed;
  ball.vx *= factor;
  ball.vy *= factor;
}

function bounceOffCircleWall(
  ball: Ball,
  arena: Arena,
  arenaIndex: number,
  events: SimEventBuffer,
): void {
  const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
  const limit = arena.radius - ball.radius;
  if (distance <= limit || distance === 0) return;
  const normalX = ball.x / distance;
  const normalY = ball.y / distance;
  ball.x = normalX * limit;
  ball.y = normalY * limit;
  const outwardSpeed = ball.vx * normalX + ball.vy * normalY;
  if (outwardSpeed <= 0) return;
  ball.vx -= 2 * outwardSpeed * normalX;
  ball.vy -= 2 * outwardSpeed * normalY;
  kickToMinSpeed(ball, arena.minBounceSpeed);
  events.push('wall-hit', arenaIndex, normalX * arena.radius, normalY * arena.radius, outwardSpeed);
}

/** Enough substeps that no ball moves more than half its radius per substep. */
function substepCount(arena: Arena): number {
  let maxTravelRatio = 0;
  for (const ball of arena.balls) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const ratio = (speed * TICK_SECONDS) / (ball.radius * MAX_TRAVEL_PER_SUBSTEP);
    if (ratio > maxTravelRatio) maxTravelRatio = ratio;
  }
  return Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(maxTravelRatio)));
}

export function stepArena(arena: Arena, arenaIndex: number, events: SimEventBuffer): void {
  for (const ball of arena.balls) {
    ball.prevX = ball.x;
    ball.prevY = ball.y;
  }
  const substeps = substepCount(arena);
  const dt = TICK_SECONDS / substeps;
  for (let substep = 0; substep < substeps; substep++) {
    for (const ball of arena.balls) {
      // Semi-implicit Euler: velocity first keeps the bounce energy stable.
      ball.vy += BASE_GRAVITY * ball.gravityScale * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
    }
    collideBalls(arena, arenaIndex, events);
    for (const ball of arena.balls) {
      bounceOffCircleWall(ball, arena, arenaIndex, events);
      limitSpeed(ball, MAX_BALL_SPEED);
    }
  }
}
