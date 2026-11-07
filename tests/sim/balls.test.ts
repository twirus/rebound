import { describe, expect, it } from 'vitest';
import type { BallId } from '../../src/content/types';
import { applyBallType, BallStatus, type Ball } from '../../src/sim/ball';
import type { SimEventKind } from '../../src/sim/events';
import { stepWorld } from '../../src/sim/step';
import type { Arena, World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

function ballWorld(types: BallId[]): { world: World; arena: Arena; balls: Ball[] } {
  const { world, arena } = worldWithBalls(11, types.length);
  arena.balls.forEach((ball, index) => applyBallType(ball, types[index] ?? 'ball:basic', 1));
  return { world, arena, balls: arena.balls };
}

function place(ball: Ball | undefined, x: number, y: number, vx: number, vy: number): Ball {
  if (!ball) throw new Error('No ball');
  Object.assign(ball, { x, y, prevX: x, prevY: y, vx, vy });
  return ball;
}

function countEvents(world: World, ticks: number, kind: SimEventKind): number {
  let count = 0;
  for (let tick = 0; tick < ticks; tick++) {
    stepWorld(world);
    for (let index = 0; index < world.events.count; index++) {
      if (world.events.at(index).kind === kind) count += 1;
    }
  }
  return count;
}

describe('ball types', () => {
  it('sticky clings to the wall, then lets go', () => {
    const { world, balls } = ballWorld(['ball:sticky']);
    const ball = place(balls[0], 0, 170, 0, 400);
    countEvents(world, 10, 'wall-hit');
    expect(ball.status).toBe(BallStatus.stuck);
    expect(countEvents(world, 130, 'unstick')).toBe(1);
    expect(ball.status).toBe(BallStatus.free);
  });

  it('frost freezes the ball it bumps into', () => {
    const { world, balls } = ballWorld(['ball:frost', 'ball:basic']);
    place(balls[0], -30, 0, 300, 0);
    const other = place(balls[1], 0, 0, 0, 0);
    countEvents(world, 10, 'ball-collision');
    expect(other.status).toBe(BallStatus.frozen);
  });

  it('void thaws a frozen ball it touches', () => {
    const { world, balls } = ballWorld(['ball:void', 'ball:basic']);
    place(balls[0], -30, 0, 300, 0);
    const other = place(balls[1], 0, 0, 0, 0);
    other.status = BallStatus.frozen;
    other.statusTicks = 600;
    countEvents(world, 10, 'ball-collision');
    expect(other.status).toBe(BallStatus.free);
  });

  it('seed hatches little short-lived balls every 10 hits', () => {
    const { world, arena, balls } = ballWorld(['ball:seed']);
    arena.minBounceSpeed = 700;
    place(balls[0], 0, 0, 0, 700);
    expect(countEvents(world, 120 * 10, 'hatch')).toBeGreaterThan(0);
    expect(arena.balls.some((ball) => ball.clone && ball.radius < 10)).toBe(true);
  });

  it('phantom slips through the wall every 5th hit and comes back', () => {
    const { world, arena, balls } = ballWorld(['ball:phantom']);
    arena.minBounceSpeed = 700;
    const ball = place(balls[0], 0, 0, 0, 700);
    let escaped = false;
    for (let tick = 0; tick < 120 * 10 && !escaped; tick++) {
      stepWorld(world);
      escaped = Math.hypot(ball.x, ball.y) > arena.radius;
    }
    expect(escaped).toBe(true);
    countEvents(world, 120 * 3, 'wall-hit');
    expect(Math.hypot(ball.x, ball.y)).toBeLessThan(arena.radius);
  });

  it('ember burns out after too many hits and comes back cold', () => {
    const { world, arena, balls } = ballWorld(['ball:ember']);
    arena.minBounceSpeed = 900;
    place(balls[0], 0, 0, 900, 0);
    expect(countEvents(world, 120 * 10, 'vanish')).toBeGreaterThan(0);
  });

  it('core pulls a nearby ball towards itself', () => {
    const { world, arena, balls } = ballWorld(['ball:core', 'ball:basic']);
    arena.gravity = 0;
    place(balls[0], 0, 0, 0, 0);
    const other = place(balls[1], 80, 0, 0, 0);
    stepWorld(world);
    expect(other.vx).toBeLessThan(0);
  });

  it('bouncy speeds up with every wall hit', () => {
    const { world, arena, balls } = ballWorld(['ball:bouncy']);
    arena.gravity = 0;
    const ball = place(balls[0], 0, 0, 300, 0);
    countEvents(world, 120 * 2, 'wall-hit');
    expect(Math.hypot(ball.vx, ball.vy)).toBeGreaterThan(300);
  });

  it('chameleon takes the next colour on every hit', () => {
    const { world, arena, balls } = ballWorld(['ball:chameleon']);
    arena.gravity = 0;
    const ball = place(balls[0], 0, 0, 400, 0);
    const colours = new Set<number>();
    for (let tick = 0; tick < 120 * 3; tick++) {
      stepWorld(world);
      colours.add(ball.tint);
    }
    expect(colours.size).toBeGreaterThanOrEqual(3);
  });

  it('light barely falls, heavy falls faster than plain', () => {
    const { world, arena, balls } = ballWorld(['ball:light', 'ball:basic', 'ball:heavy']);
    arena.balls.forEach((ball, index) => place(ball, -60 + index * 60, -100, 0, 0));
    for (let tick = 0; tick < 30; tick++) stepWorld(world);
    const [light, plain, heavy] = balls.map((ball) => ball.vy);
    expect(light ?? 0).toBeLessThan((plain ?? 0) / 3);
    expect(heavy ?? 0).toBeGreaterThan(plain ?? 0);
  });
});
