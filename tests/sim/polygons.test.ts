import { describe, expect, it } from 'vitest';
import type { ShapeId } from '../../src/content/types';
import type { SimEventKind } from '../../src/sim/events';
import { stepWorld } from '../../src/sim/step';
import { findShape, setArenaShape, type Arena, type World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

function shapeWorld(shapeId: ShapeId): { world: World; arena: Arena } {
  const { world, arena } = worldWithBalls(5, 1);
  const def = findShape(shapeId);
  setArenaShape(world, arena, def, def.radius);
  return { world, arena };
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

describe('triangle', () => {
  it('splits a ball hitting near a corner, and the copy disappears after 4 s', () => {
    const { world, arena } = shapeWorld('shape:triangle');
    if (arena.shape.kind !== 'triangle') throw new Error('Expected triangle');
    // Bottom-left corner of a triangle pointing up sits at 210° from the centre.
    const corner = {
      x: arena.shape.polygon.cornersX[2] ?? 0,
      y: arena.shape.polygon.cornersY[2] ?? 0,
    };
    place(arena, corner.x * 0.75, corner.y * 0.75, corner.x * 4, corner.y * 4);
    expect(countEvents(world, 20, 'split')).toBeGreaterThanOrEqual(1);
    expect(arena.balls.some((ball) => ball.clone)).toBe(true);
    countEvents(world, 120 * 4, 'split');
    // Copies made later may still be alive; the first ones are gone and none is older than 4 s.
    expect(arena.balls.every((ball) => !ball.clone || ball.lifeTicks <= 120 * 4)).toBe(true);
  });

  it('never splits a copy', () => {
    const { world, arena } = shapeWorld('shape:triangle');
    const ball = arena.balls[0];
    if (!ball || arena.shape.kind !== 'triangle') throw new Error('Expected triangle');
    ball.clone = true;
    ball.lifeTicks = 600;
    const corner = {
      x: arena.shape.polygon.cornersX[2] ?? 0,
      y: arena.shape.polygon.cornersY[2] ?? 0,
    };
    place(arena, corner.x * 0.75, corner.y * 0.75, corner.x * 4, corner.y * 4);
    expect(countEvents(world, 20, 'split')).toBe(0);
  });
});

describe('square', () => {
  it('sends a ball through the portal to the opposite side', () => {
    const { world, arena } = shapeWorld('shape:square');
    if (arena.shape.kind !== 'square') throw new Error('Expected square');
    const { normalsX, normalsY, apothem } = arena.shape.polygon;
    const side = arena.shape.portalSide;
    const normal = { x: normalsX[side] ?? 0, y: normalsY[side] ?? 0 };
    place(
      arena,
      normal.x * (apothem - 12),
      normal.y * (apothem - 12),
      normal.x * 600,
      normal.y * 600,
    );
    expect(countEvents(world, 10, 'portal')).toBe(1);
    const ball = arena.balls[0];
    const along = (ball?.x ?? 0) * normal.x + (ball?.y ?? 0) * normal.y;
    expect(along).toBeLessThan(-apothem / 2);
  });

  it('moves the portal clockwise after enough hits', () => {
    const { world, arena } = shapeWorld('shape:square');
    if (arena.shape.kind !== 'square') throw new Error('Expected square');
    const start = arena.shape.portalSide;
    arena.minBounceSpeed = 500;
    countEvents(world, 120 * 20, 'wall-hit');
    expect(arena.shape.portalSide).not.toBe(start);
  });
});

describe('hexagon', () => {
  it('colours the ball and counts combos on its own colour', () => {
    const { world, arena } = shapeWorld('shape:hexagon');
    arena.minBounceSpeed = 300;
    // Bouncing on the bottom side keeps hitting the same colour.
    place(arena, 0, 100, 0, 300);
    expect(countEvents(world, 120 * 4, 'combo')).toBeGreaterThan(0);
    expect(arena.balls[0]?.tint).toBeGreaterThanOrEqual(0);
  });
});
