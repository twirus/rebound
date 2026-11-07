import { describe, expect, it } from 'vitest';
import type { SimEventKind } from '../../src/sim/events';
import type { RingsState } from '../../src/sim/shapes/rings';
import { stepWorld } from '../../src/sim/step';
import { findShape, setArenaShape, type Arena, type World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

const RADIUS = 227;

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
    expect(state.rings).toHaveLength(14);
    expect(innerRadius).toBeCloseTo(32);
    expect(state.rings[13]?.radius).toBeCloseTo(RADIUS);
  });

  it('breaks a ring when a ball flies through its gap', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    // The innermost gap starts at the top (negative y).
    place(arena, 0, -(innerRadius - 15), 0, -400);
    // Gaps start lined up, so the ball may shatter several rings in a row.
    expect(countEvents(world, 30, 'ring-break')).toBeGreaterThanOrEqual(1);
    expect(state.rings[0]?.broken).toBe(true);
  });

  it('starts a new round once the ball has flown clear of the broken rings', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    for (const ring of state.rings) {
      ring.broken = true;
      ring.turnSin = -Math.abs(ring.turnSin);
    }
    place(arena, 0, RADIUS * 1.2, 0, 0);
    expect(countEvents(world, 1, 'round-reset')).toBe(1);
    expect(state.rings.every((ring) => !ring.broken && ring.turnSin > 0)).toBe(true);
    const ball = arena.balls[0];
    expect(Math.hypot(ball?.x ?? 0, ball?.y ?? 0)).toBeLessThan(innerRadius);
  });

  it('lines the gaps up again after winding back the same time', () => {
    const { world, arena, state } = ringsWorld();
    arena.balls.length = 0;
    for (let tick = 0; tick < 300; tick++) stepWorld(world);
    const fanned = state.rings.map((ring) => ring.gapX);
    expect(new Set(fanned.map((x) => x.toFixed(3))).size).toBeGreaterThan(1);
    for (const ring of state.rings) ring.turnSin = -ring.turnSin;
    for (let tick = 0; tick < 300; tick++) stepWorld(world);
    for (const ring of state.rings) {
      expect(ring.gapX).toBeCloseTo(0, 6);
      expect(ring.gapY).toBeCloseTo(-1, 6);
    }
  });

  it('reverses the spin of every ring when one breaks', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    // Only the innermost ring can be reached and broken, so the spin flips exactly once;
    // the outermost stays whole so this is not a new round.
    for (const ring of state.rings.slice(1, -1)) ring.broken = true;
    const spins = state.rings.map((ring) => ring.turnSin);
    place(arena, 0, -(innerRadius - 15), 0, -400);
    expect(countEvents(world, 30, 'ring-break')).toBe(1);
    expect(state.rings.map((ring) => ring.turnSin)).toEqual(spins.map((spin) => -spin));
  });

  it('bounces a ball off the solid part and keeps the ring whole', () => {
    const { world, arena, state, innerRadius } = ringsWorld();
    place(arena, 0, innerRadius - 8, 0, 400);
    expect(countEvents(world, 8, 'wall-hit')).toBeGreaterThan(0);
    expect(state.rings[0]?.broken).toBe(false);
    const ball = arena.balls[0];
    expect(Math.hypot(ball?.x ?? 0, ball?.y ?? 0)).toBeLessThan(innerRadius);
  });

  it('never grows a broken ring back during a round', () => {
    const { world, arena, state } = ringsWorld();
    arena.balls.length = 0;
    const ring = state.rings[1];
    if (!ring) throw new Error('No ring');
    ring.broken = true;
    countEvents(world, 120 * 60, 'wall-hit');
    expect(ring.broken).toBe(true);
  });

  it('counts an escape when the outermost ring is shattered', () => {
    const { world, arena, state } = ringsWorld();
    const outer = state.rings[state.rings.length - 1];
    if (!outer) throw new Error('No ring');
    place(arena, outer.gapX * (outer.radius - 1), outer.gapY * (outer.radius - 1), 0, 0);
    expect(countEvents(world, 1, 'escape')).toBe(1);
    expect(outer.broken).toBe(true);
  });
});
