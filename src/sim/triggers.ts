import type { ShapeContext } from './shapes';
import { TICK_SECONDS } from './constants';
import { isStill } from './balls/status';

/** A ball entering this distance of the centre "touches the centre". */
const CENTER_RADIUS = 14;
/** Slower than this counts as nearly stopped; it must reach twice this to count again. */
const STALL_SPEED = 25;
/** At this share of its speed cap a ball is "at top speed"; below the lower share it resets. */
const TOP_SPEED_SHARE = 0.97;
const TOP_SPEED_RESET_SHARE = 0.8;
/** Seconds without a single wall hit that make a "quiet" moment. */
const QUIET_SECONDS = 5;

/**
 * Reports moments that are not collisions of their own: touching the centre,
 * nearly stopping, reaching top speed, a quiet arena. Each fires once when it
 * starts, not every tick it lasts.
 */
export function detectTriggers(context: ShapeContext, firstEvent: number): void {
  const { arena, arenaIndex, events } = context;
  for (const ball of arena.balls) {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    const before = Math.sqrt(ball.prevX * ball.prevX + ball.prevY * ball.prevY);
    if (distance < CENTER_RADIUS && before >= CENTER_RADIUS) {
      events.push('center', arenaIndex, ball.x, ball.y, distance, ball);
    }
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (!ball.slow && speed < STALL_SPEED && !isStill(ball)) {
      ball.slow = true;
      events.push('stall', arenaIndex, ball.x, ball.y, speed, ball);
    } else if (speed > STALL_SPEED * 2) {
      ball.slow = false;
    }
    if (!ball.fast && speed >= ball.maxSpeed * TOP_SPEED_SHARE) {
      ball.fast = true;
      events.push('max-speed', arenaIndex, ball.x, ball.y, speed, ball);
    } else if (speed < ball.maxSpeed * TOP_SPEED_RESET_SHARE) {
      ball.fast = false;
    }
  }
  let hit = false;
  for (let index = firstEvent; index < events.count && !hit; index++) {
    hit = events.at(index).kind === 'wall-hit';
  }
  arena.quietTicks = hit ? 0 : arena.quietTicks + 1;
  if (arena.quietTicks >= Math.round(QUIET_SECONDS / TICK_SECONDS)) {
    arena.quietTicks = 0;
    events.push('quiet', arenaIndex, 0, 0, QUIET_SECONDS);
  }
}
