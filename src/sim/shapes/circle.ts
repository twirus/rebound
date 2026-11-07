import type { ShapeBehavior } from './behavior';
import { bounceRadial, kickToMinSpeed } from './walls';

export interface CircleState {
  kind: 'circle';
}

/** One solid round wall: stable, predictable bounces. */
export const circleBehavior: ShapeBehavior<CircleState> = {
  create: () => ({ kind: 'circle' }),
  step: () => undefined,
  collide(_state, ball, { arena, arenaIndex, events }) {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    const limit = arena.radius - ball.radius;
    if (distance <= limit || distance === 0) return;
    const normalX = ball.x / distance;
    const normalY = ball.y / distance;
    const speed = bounceRadial(ball, normalX, normalY, limit, 1);
    if (speed === 0) return;
    kickToMinSpeed(ball, arena.minBounceSpeed);
    events.push(
      'wall-hit',
      arenaIndex,
      normalX * arena.radius,
      normalY * arena.radius,
      speed,
      ball,
    );
  },
  spawnRadius: (_state, arenaRadius) => arenaRadius,
  hash: () => undefined,
};
