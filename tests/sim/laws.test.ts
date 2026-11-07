import { describe, expect, it } from 'vitest';
import type { GemId, SimEventKind } from '../../src/content/types';
import { resizeBall } from '../../src/sim/ball';
import { setArenaLaw } from '../../src/sim/gems';
import { runLaw } from '../../src/sim/gems/laws';
import { stepWorld } from '../../src/sim/step';
import type { Arena, Ball, World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

function lawWorld(law: GemId, balls = 2): { world: World; arena: Arena; balls: Ball[] } {
  const { world, arena } = worldWithBalls(29, balls);
  setArenaLaw(arena, law);
  return { world, arena, balls: arena.balls };
}

function place(ball: Ball | undefined, x: number, y: number, vx: number, vy: number): Ball {
  if (!ball) throw new Error('No ball');
  Object.assign(ball, { x, y, prevX: x, prevY: y, vx, vy });
  return ball;
}

function run(world: World, ticks: number, kind?: SimEventKind): number {
  let count = 0;
  for (let tick = 0; tick < ticks; tick++) {
    stepWorld(world);
    for (let index = 0; index < world.events.count && kind; index++) {
      if (world.events.at(index).kind === kind) count += 1;
    }
  }
  return count;
}

describe('laws', () => {
  it('tides turn gravity slowly round', () => {
    const { world, arena } = lawWorld('law:tides');
    run(world, 120 * 5);
    expect(arena.gravityX).not.toBe(0);
    expect(Math.hypot(arena.gravityX, arena.gravityY)).toBeCloseTo(1, 9);
  });

  it('flock brings everyone to a shared heading', () => {
    const { world, arena, balls } = lawWorld('law:flock', 2);
    arena.gravity = 0;
    place(balls[0], -60, 0, 300, 0);
    place(balls[1], 60, 0, 0, 300);
    // Half a second: long enough to align, too short to reach a wall.
    run(world, 60);
    const [first, second] = balls;
    const gap = Math.hypot(
      (first?.vx ?? 0) - (second?.vx ?? 0),
      (first?.vy ?? 0) - (second?.vy ?? 0),
    );
    expect(gap).toBeLessThan(Math.hypot(300, 300) / 2);
  });

  it('hourglass runs time faster at the top than at the bottom', () => {
    const { world, arena, balls } = lawWorld('law:hourglass');
    arena.gravity = 0;
    const top = place(balls[0], -60, -60, 100, 0);
    const bottom = place(balls[1], -60, 60, 100, 0);
    run(world, 30);
    expect(top.x + 60).toBeCloseTo((bottom.x + 60) * 4, 5);
  });

  it('thermodynamics heats balls with every hit until they melt through', () => {
    const { world, arena, balls } = lawWorld('law:thermo', 1);
    arena.minBounceSpeed = 700;
    const ball = place(balls[0], 0, 0, 700, 0);
    run(world, 60);
    expect(ball.heat).toBeGreaterThan(0);
    let melted = false;
    for (let tick = 0; tick < 120 * 8 && !melted; tick++) {
      stepWorld(world);
      melted = ball.status === 3;
    }
    expect(melted).toBe(true);
  });

  it('legacy hands a vanishing ball’s size and heat to the nearest one', () => {
    const { world, arena, balls } = lawWorld('law:legacy', 2);
    const gone = place(balls[0], 0, 0, 0, 0);
    const heir = place(balls[1], 40, 0, 0, 0);
    resizeBall(gone, 1.8);
    gone.heat = 9;
    world.events.clear();
    world.events.push('vanish', 0, 0, 0, 0, gone);
    runLaw({ world, arena, arenaIndex: 0, events: world.events, rng: world.rng }, 0);
    expect(heir.radius).toBeCloseTo(heir.baseRadius * 1.8);
    expect(heir.heat).toBe(9);
  });

  it('hunger shrinks every ball and lets a big one swallow a small one', () => {
    const { world, arena, balls } = lawWorld('law:hunger', 2);
    arena.gravity = 0;
    const big = place(balls[0], -30, 0, 200, 0);
    const small = place(balls[1], 30, 0, -200, 0);
    resizeBall(big, 1.6);
    expect(run(world, 60, 'merge')).toBe(1);
    expect(big.radius).toBeGreaterThan(big.baseRadius * 1.6 * 0.95);
    // The swallowed ball comes back full size (and starts slowly shrinking again).
    expect(small.radius).toBeGreaterThan(small.baseRadius * 0.95);
  });

  it('entropy shoves balls around harder as it builds up', () => {
    const { world, arena, balls } = lawWorld('law:entropy', 1);
    arena.gravity = 0;
    const ball = place(balls[0], 0, 0, 0, 0);
    run(world, 10);
    expect(ball.vx).toBe(0);
    arena.entropy = 1;
    run(world, 10);
    expect(ball.vx).not.toBe(0);
  });
});
