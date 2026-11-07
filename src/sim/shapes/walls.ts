import type { Rng } from '../../core/rng';
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

/**
 * Holds the ball inside a round wall of the given radius and bounces it.
 * Returns the impact speed, or 0 when the ball did not hit the wall.
 */
export function bounceInsideCircle(ball: Ball, radius: number, minBounceSpeed: number): number {
  const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
  const limit = radius - ball.radius;
  if (distance <= limit || distance === 0) return 0;
  const speed = bounceRadial(ball, ball.x / distance, ball.y / distance, limit, 1);
  if (speed > 0) kickToMinSpeed(ball, minBounceSpeed);
  return speed;
}

/** Puts the ball somewhere near the centre, within `spread`, heading up. */
export function respawnNearCentre(ball: Ball, spread: number, speed: number, rng: Rng): void {
  ball.x = rng.nextRange(-spread, spread);
  ball.y = rng.nextRange(-spread, spread);
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.vx = rng.nextRange(-speed, speed);
  ball.vy = -speed;
}
