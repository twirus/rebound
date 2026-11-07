import type { Ball } from '../world';

/**
 * Places the ball at `distance` from the centre along the unit normal and
 * reflects its velocity off a round wall. `side` is +1 when the wall is outside
 * the ball (ball held inside), −1 when the wall is inside (ball held outside).
 * Returns the impact speed, or 0 when the ball was already moving away.
 */
export function bounceRadial(
  ball: Ball,
  normalX: number,
  normalY: number,
  distance: number,
  side: 1 | -1,
): number {
  ball.x = normalX * distance;
  ball.y = normalY * distance;
  const towardWall = (ball.vx * normalX + ball.vy * normalY) * side;
  if (towardWall <= 0) return 0;
  ball.vx -= 2 * towardWall * side * normalX;
  ball.vy -= 2 * towardWall * side * normalY;
  return towardWall;
}

/** A ball leaving a wall slower than `minSpeed` is kicked up to it. */
export function kickToMinSpeed(ball: Ball, minSpeed: number): void {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed === 0 || speed >= minSpeed) return;
  const factor = minSpeed / speed;
  ball.vx *= factor;
  ball.vy *= factor;
}
