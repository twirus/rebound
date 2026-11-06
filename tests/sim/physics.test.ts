import { describe, expect, it } from 'vitest';
import { MAX_BALL_SPEED } from '../../src/sim/constants';
import { queuePush } from '../../src/sim/push';
import { stepWorld } from '../../src/sim/step';
import type { Arena, Ball } from '../../src/sim/world';
import { runTicks, worldWithBalls } from './helpers';

function eachBall(arena: Arena, check: (ball: Ball) => void): void {
  for (const ball of arena.balls) check(ball);
}

describe('circle arena', () => {
  it('keeps every ball inside the wall', () => {
    const { world, arena } = worldWithBalls(99, 60);
    runTicks(world, 6_000, () =>
      eachBall(arena, (ball) => {
        expect(Math.hypot(ball.x, ball.y)).toBeLessThanOrEqual(arena.radius - ball.radius + 1e-9);
      }),
    );
  });

  it('never exceeds the speed limit', () => {
    const { world, arena } = worldWithBalls(3, 20);
    arena.minBounceSpeed = 2_000;
    runTicks(world, 2_000, () =>
      eachBall(arena, (ball) => {
        expect(Math.hypot(ball.vx, ball.vy)).toBeLessThanOrEqual(MAX_BALL_SPEED + 1e-6);
      }),
    );
  });

  it('keeps a single ball bouncing instead of settling', () => {
    const { world, arena } = worldWithBalls(5, 1);
    runTicks(world, 12_000);
    const ball = arena.balls[0];
    if (!ball) throw new Error('No ball');
    expect(Math.hypot(ball.vx, ball.vy)).toBeGreaterThan(50);
  });

  it('kicks slow balls up to the minimum bounce speed', () => {
    const { world, arena } = worldWithBalls(8, 1);
    arena.minBounceSpeed = 700;
    let fastestLeave = 0;
    runTicks(world, 2_000, () => {
      for (let index = 0; index < world.events.count; index++) {
        if (world.events.at(index).kind !== 'wall-hit') continue;
        const ball = arena.balls[0];
        if (ball) fastestLeave = Math.max(fastestLeave, Math.hypot(ball.vx, ball.vy));
      }
    });
    expect(fastestLeave).toBeGreaterThanOrEqual(700);
  });
});

describe('ball collisions', () => {
  it('separates overlapping balls and reports a collision', () => {
    const { world, arena } = worldWithBalls(1, 2);
    const [first, second] = arena.balls;
    if (!first || !second) throw new Error('No balls');
    Object.assign(first, { x: -5, y: 0, vx: 200, vy: 0 });
    Object.assign(second, { x: 5, y: 0, vx: -200, vy: 0 });
    stepWorld(world);
    const kinds = Array.from(
      { length: world.events.count },
      (_, index) => world.events.at(index).kind,
    );
    expect(kinds).toContain('ball-collision');
    expect(Math.hypot(second.x - first.x, second.y - first.y)).toBeGreaterThanOrEqual(
      first.radius + second.radius - 1e-9,
    );
    expect(first.vx).toBeLessThan(0);
    expect(second.vx).toBeGreaterThan(0);
  });

  it('keeps balls from passing through each other at top speed', () => {
    const { world, arena } = worldWithBalls(1, 2);
    const [first, second] = arena.balls;
    if (!first || !second) throw new Error('No balls');
    Object.assign(first, { x: -60, y: 0, vx: MAX_BALL_SPEED, vy: 0 });
    Object.assign(second, { x: 60, y: 0, vx: -MAX_BALL_SPEED, vy: 0 });
    runTicks(world, 8);
    expect(first.x).toBeLessThan(second.x);
  });
});

describe('push', () => {
  it('pushes nearby balls away and ignores far ones', () => {
    const { world, arena } = worldWithBalls(2, 2);
    const [near, far] = arena.balls;
    if (!near || !far) throw new Error('No balls');
    Object.assign(near, { x: 30, y: 0, vx: 0, vy: 0 });
    Object.assign(far, { x: -150, y: 0, vx: 0, vy: 0 });
    queuePush(world, { arenaIndex: 0, x: 0, y: 0, strength: 500, reach: 100 });
    stepWorld(world);
    expect(near.vx).toBeGreaterThan(300);
    expect(Math.abs(far.vx)).toBeLessThan(1e-9);
    expect(world.events.at(0).kind).toBe('push');
  });
});
