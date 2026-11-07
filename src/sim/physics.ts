import { collideBalls } from './collisions';
import { BASE_GRAVITY, MAX_SUBSTEPS, MAX_TRAVEL_PER_SUBSTEP, TICK_SECONDS } from './constants';
import { BallStatus } from './ball';
import { afterWallContact, tickBalls } from './balls';
import { isStill } from './balls/status';
import { lawTimeScale, runLaw } from './gems/laws';
import { runSchemes } from './gems/runner';
import { detectTriggers } from './triggers';
import { collideShape, stepShape, type ShapeContext } from './shapes';
import { expireClones } from './clones';
import type { Arena, Ball, World } from './world';

/*
 * Only + - * / and Math.sqrt are used in sim/ (trigonometry comes from
 * core/detMath): they are exactly specified by IEEE 754, so results match
 * across engines.
 */

export function limitSpeed(ball: Ball, maxSpeed: number): void {
  const speedSquared = ball.vx * ball.vx + ball.vy * ball.vy;
  if (speedSquared <= maxSpeed * maxSpeed) return;
  const factor = maxSpeed / Math.sqrt(speedSquared);
  ball.vx *= factor;
  ball.vy *= factor;
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

export function stepArena(arena: Arena, arenaIndex: number, world: World): void {
  const context: ShapeContext = { world, arena, arenaIndex, events: world.events, rng: world.rng };
  const firstEvent = world.events.count;
  stepShape(arena.shape, context);
  for (const ball of arena.balls) {
    ball.prevX = ball.x;
    ball.prevY = ball.y;
  }
  const substeps = substepCount(arena);
  const dt = TICK_SECONDS / substeps;
  for (let substep = 0; substep < substeps; substep++) {
    for (const ball of arena.balls) {
      if (isStill(ball)) continue;
      // Semi-implicit Euler: velocity first keeps the bounce energy stable.
      const step = arena.law ? dt * lawTimeScale(context, ball) : dt;
      const pull = BASE_GRAVITY * arena.gravity * ball.gravityScale * step;
      ball.vx += pull * arena.gravityX;
      ball.vy += pull * arena.gravityY;
      ball.x += ball.vx * step;
      ball.y += ball.vy * step;
    }
    collideBalls(context);
    for (const ball of arena.balls) {
      if (ball.status !== BallStatus.phasing) {
        const firstEvent = world.events.count;
        collideShape(arena.shape, ball, context);
        afterWallContact(ball, firstEvent, context);
      }
      limitSpeed(ball, ball.maxSpeed);
    }
  }
  tickBalls(context);
  detectTriggers(context, firstEvent);
  runLaw(context, firstEvent);
  runSchemes(context, firstEvent);
  expireClones(arena);
}
