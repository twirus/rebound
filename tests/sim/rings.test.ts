import { describe, expect, it } from 'vitest';
import type { SimEventKind } from '../../src/sim/events';
import type { RingsState } from '../../src/sim/shapes/rings';
import { stepWorld } from '../../src/sim/step';
import { findShape, setArenaShape, type Arena, type World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

const RADIUS = 292;
const REGROW_TICKS = 8 * 120;

function ringsWorld(): { world: World; arena: Arena; state: RingsState; innerRadius: number } {
  const { world, arena } = worldWithBalls(3, 1);
  setArenaShape(world, arena, findShape('shape:rings'), RADIUS);
  if (arena.shape.kind !== 'rings') throw new Error('Expected rings');
  const innerRadius = arena.shape.rings[0]?.radius ?? 0;
  return { world, arena, state: arena.shape, innerRadius };
}

function place(arena: Arena, x: number, y: number, vx: number, vy: number): void {
  const ball = arena.balls[0];
  if (!ball) throw new Error('No ball');
  Object.assign(ball, { x, y, prevX: x, prevY: y, vx, vy });
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

describe('rings', () => {
  it('builds the configured number of rings, innermost first', () => {
    const { state, innerRadius } = ringsWorld();
    expect(state.rings).toHaveLength(12);
    expect(innerRadius).toBeCloseTo(50);
    expect(state.rings[11]?.radius).toBeCloseTo(RADIUS);
  });

  it('breaks a ring when a ball flies through its gap', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    // The innermost gap starts at the top (negative y).
    place(arena, 0, -(innerRadius - 15), 0, -400);
    expect(countEvents(world, 30, 'ring-break')).toBe(1);
    expect(state.rings[0]?.broken).toBe(true);
  });

  it('reverses the spin of every ring when one breaks', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    const spins = state.rings.map((ring) => ring.turnSin);
    place(arena, 0, -(innerRadius - 15), 0, -400);
    countEvents(world, 30, 'ring-break');
    expect(state.rings.map((ring) => ring.turnSin)).toEqual(spins.map((spin) => -spin));
  });

  it('bounces a ball off the solid part and keeps the ring whole', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    place(arena, 0, innerRadius - 15, 0, 400);
    expect(countEvents(world, 30, 'wall-hit')).toBeGreaterThan(0);
    expect(state.rings[0]?.broken).toBe(false);
    const ball = arena.balls[0];
    expect(Math.hypot(ball?.x ?? 0, ball?.y ?? 0)).toBeLessThan(innerRadius);
  });

  it('keeps a ring broken while a ball lies across it', () => {
    const { world, arena, state } = ringsWorld();
    const ring = state.rings[1];
    if (!ring) throw new Error('No ring');
    ring.broken = true;
    ring.regrowLeft = 1;
    place(arena, 0, ring.radius, 0, 0);
    stepWorld(world);
    expect(ring.broken).toBe(true);
  });

  it('grows a broken ring back once it is clear', () => {
    const { world, arena, state } = ringsWorld();
    arena.balls.length = 0;
    const ring = state.rings[1];
    if (!ring) throw new Error('No ring');
    ring.broken = true;
    ring.regrowLeft = REGROW_TICKS;
    countEvents(world, REGROW_TICKS + 1, 'wall-hit');
    expect(ring.broken).toBe(false);
  });

  it('counts an escape when the outermost ring is shattered', () => {
    const { world, arena, state } = ringsWorld();
    const outer = state.rings[state.rings.length - 1];
    if (!outer) throw new Error('No ring');
    place(arena, outer.gapX * (outer.radius - 4), outer.gapY * (outer.radius - 4), 0, 0);
    expect(countEvents(world, 1, 'escape')).toBe(1);
    expect(outer.broken).toBe(true);
  });

  it('returns a ball that fell out of every ring to the centre, without reward', () => {
    const { world, arena, innerRadius } = ringsWorld();
    place(arena, 0, RADIUS + 40, 0, 100);
    expect(countEvents(world, 2, 'escape')).toBe(0);
    const ball = arena.balls[0];
    expect(Math.hypot(ball?.x ?? 0, ball?.y ?? 0)).toBeLessThan(innerRadius);
  });
});
