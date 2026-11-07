import { BallStatus, type Ball } from '../ball';
import { TICK_SECONDS } from '../constants';

/** Puts the ball into a timed status; still statuses keep its velocity to resume with. */
export function startStatus(ball: Ball, status: BallStatus, seconds: number): void {
  if (status !== BallStatus.phasing) {
    ball.storedVx = ball.vx;
    ball.storedVy = ball.vy;
    ball.vx = 0;
    ball.vy = 0;
  }
  ball.status = status;
  ball.statusTicks = Math.max(1, Math.round(seconds / TICK_SECONDS));
}

/** A stuck or frozen ball hangs where it is; it neither falls nor moves. */
export function isStill(ball: Ball): boolean {
  return ball.status === BallStatus.stuck || ball.status === BallStatus.frozen;
}

/** Counts the status down; returns true on the tick it ends. Still balls resume their velocity. */
export function tickStatus(ball: Ball): boolean {
  if (ball.statusTicks <= 0) return false;
  ball.statusTicks -= 1;
  if (ball.statusTicks > 0) return false;
  if (isStill(ball)) {
    ball.vx = ball.storedVx;
    ball.vy = ball.storedVy;
  }
  ball.status = BallStatus.free;
  return true;
}
