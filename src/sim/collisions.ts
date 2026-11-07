import { afterTouch } from './balls';
import { lawTouch } from './gems/laws';
import type { ShapeContext } from './shapes';
import { SpatialGrid } from './spatialGrid';
import type { Ball } from './world';

const grid = new SpatialGrid();
let xs = new Float64Array(64);
let ys = new Float64Array(64);

function ensureCapacity(count: number): void {
  if (xs.length >= count) return;
  xs = new Float64Array(count * 2);
  ys = new Float64Array(count * 2);
}

/** Elastic collision of two circles; returns the closing speed, or 0 if nothing happened. */
function resolvePair(first: Ball, second: Ball): number {
  // A ball charging in a star ray is out of play until it fires; others pass through it.
  if (first.heldTicks > 0 || second.heldTicks > 0) return 0;
  if (!first.solid || !second.solid) return 0;
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const minDistance = first.radius + second.radius;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= minDistance * minDistance || distanceSquared === 0) return 0;
  const distance = Math.sqrt(distanceSquared);
  const normalX = dx / distance;
  const normalY = dy / distance;
  const totalMass = first.mass + second.mass;
  const overlap = minDistance - distance;
  first.x -= normalX * overlap * (second.mass / totalMass);
  first.y -= normalY * overlap * (second.mass / totalMass);
  second.x += normalX * overlap * (first.mass / totalMass);
  second.y += normalY * overlap * (first.mass / totalMass);
  const closingSpeed = (first.vx - second.vx) * normalX + (first.vy - second.vy) * normalY;
  if (closingSpeed <= 0) return 0;
  const impulse = (2 * closingSpeed) / totalMass;
  first.vx -= impulse * second.mass * normalX;
  first.vy -= impulse * second.mass * normalY;
  second.vx += impulse * first.mass * normalX;
  second.vy += impulse * first.mass * normalY;
  return closingSpeed;
}

function fillPositions(balls: readonly Ball[]): number {
  let maxRadius = 0;
  balls.forEach((ball, index) => {
    xs[index] = ball.x;
    ys[index] = ball.y;
    if (ball.radius > maxRadius) maxRadius = ball.radius;
  });
  return maxRadius;
}

/** Each ball is checked against higher-index balls in its own and neighbouring cells. */
export function collideBalls(context: ShapeContext): void {
  const { arena, arenaIndex, events } = context;
  const balls = arena.balls;
  const count = balls.length;
  if (count < 2) return;
  ensureCapacity(count);
  const maxRadius = fillPositions(balls);
  grid.rebuild(arena.radius, maxRadius * 2, xs, ys, count);
  for (let index = 0; index < count; index++) {
    const ball = balls[index] as Ball;
    const column = grid.columnOf(xs[index] ?? 0);
    const row = grid.columnOf(ys[index] ?? 0);
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
        let other = grid.firstIn(column + columnOffset, row + rowOffset);
        while (other !== -1) {
          if (other > index) {
            const otherBall = balls[other] as Ball;
            const speed = resolvePair(ball, otherBall);
            if (speed > 0) {
              const midX = (ball.x + otherBall.x) / 2;
              const midY = (ball.y + otherBall.y) / 2;
              events.push('ball-collision', arenaIndex, midX, midY, speed);
              afterTouch(ball, otherBall, context);
              lawTouch(ball, otherBall, context);
            }
          }
          other = grid.nextAfter(other);
        }
      }
    }
  }
}
