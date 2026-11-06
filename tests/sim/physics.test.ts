import { describe, expect, it } from 'vitest';
import { stepWorld } from '../../src/sim/step';
import { createWorld } from '../../src/sim/world';

describe('circle arena', () => {
  it('keeps the ball inside the wall for a long run', () => {
    const world = createWorld(99);
    const arena = world.arenas[0];
    if (!arena) throw new Error('No arena');
    for (let tick = 0; tick < 20_000; tick++) {
      stepWorld(world);
      for (const ball of arena.balls) {
        const distance = Math.hypot(ball.x, ball.y);
        expect(distance).toBeLessThanOrEqual(arena.radius - ball.radius + 1e-9);
      }
    }
  });

  it('keeps the ball bouncing instead of settling', () => {
    const world = createWorld(5);
    for (let tick = 0; tick < 12_000; tick++) stepWorld(world);
    const ball = world.arenas[0]?.balls[0];
    if (!ball) throw new Error('No ball');
    expect(Math.hypot(ball.vx, ball.vy)).toBeGreaterThan(50);
  });
});
