import type { Arena, Ball } from './world';
import { findBall } from './world';
import { BASE_GRAVITY, TICK_SECONDS } from './constants';

/**
 * Only + - * / and Math.sqrt are used here: they are exactly specified by
 * IEEE 754, unlike Math.sin/exp, so results match across engines.
 */
function bounceOffCircleWall(ball: Ball, arenaRadius: number): void {
  const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
  const limit = arenaRadius - ball.radius;
  if (distance <= limit || distance === 0) return;
  const normalX = ball.x / distance;
  const normalY = ball.y / distance;
  ball.x = normalX * limit;
  ball.y = normalY * limit;
  const outwardSpeed = ball.vx * normalX + ball.vy * normalY;
  if (outwardSpeed > 0) {
    ball.vx -= 2 * outwardSpeed * normalX;
    ball.vy -= 2 * outwardSpeed * normalY;
  }
}

export function stepArena(arena: Arena): void {
  for (const ball of arena.balls) {
    const gravity = BASE_GRAVITY * findBall(ball.typeId).gravityScale;
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    // Semi-implicit Euler: velocity first keeps the bounce energy stable.
    ball.vy += gravity * TICK_SECONDS;
    ball.x += ball.vx * TICK_SECONDS;
    ball.y += ball.vy * TICK_SECONDS;
    bounceOffCircleWall(ball, arena.radius);
  }
}
