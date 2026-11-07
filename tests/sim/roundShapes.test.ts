import { describe, expect, it } from 'vitest';
import type { ShapeId } from '../../src/content/types';
import type { SimEventKind } from '../../src/sim/events';
import { tileAt } from '../../src/sim/shapes/mosaic';
import { stepWorld } from '../../src/sim/step';
import { findShape, setArenaShape, type Arena, type World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

function shapeWorld(shapeId: ShapeId, balls = 1): { world: World; arena: Arena } {
  const { world, arena } = worldWithBalls(9, balls);
  const def = findShape(shapeId);
  setArenaShape(world, arena, def, def.radius);
  return { world, arena };
}

function place(arena: Arena, index: number, x: number, y: number, vx: number, vy: number): void {
  const ball = arena.balls[index];
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

describe('mosaic', () => {
  it('wears a tile down hit by hit and breaks it on the last one', () => {
    const { world, arena } = shapeWorld('shape:mosaic');
    if (arena.shape.kind !== 'mosaic') throw new Error('Expected mosaic');
    const tile = arena.shape.tiles[tileAt(arena.shape, 0, arena.radius)];
    if (!tile) throw new Error('No tile');
    // A ball dropped straight down keeps landing on the same bottom tile.
    place(arena, 0, 0, arena.radius - 40, 0, 300);
    countEvents(world, 120, 'tile-break');
    expect(tile.hitsLeft).toBeLessThan(3);
    expect(countEvents(world, 120 * 12, 'tile-break')).toBeGreaterThanOrEqual(1);
  });

  it('grows a broken tile back once its hole is clear', () => {
    const { world, arena } = shapeWorld('shape:mosaic');
    if (arena.shape.kind !== 'mosaic') throw new Error('Expected mosaic');
    arena.balls.length = 0;
    const tile = arena.shape.tiles[0];
    if (!tile) throw new Error('No tile');
    tile.hitsLeft = 0;
    tile.regrowLeft = 10;
    countEvents(world, 11, 'tile-break');
    expect(tile.hitsLeft).toBe(arena.shape.durability);
  });
});

describe('spiral', () => {
  it('pulls balls into the core, pays for it and throws them back out', () => {
    const { world, arena } = shapeWorld('shape:spiral');
    place(arena, 0, 0, -120, 0, 0);
    expect(countEvents(world, 120 * 6, 'core-reach')).toBeGreaterThan(0);
  });
});

describe('star', () => {
  it('catches a ball in a ray, charges it and fires it back', () => {
    const { world, arena } = shapeWorld('shape:star');
    // The first ray points straight up.
    place(arena, 0, 0, -(arena.radius - 30), 0, -500);
    countEvents(world, 30, 'launch');
    expect(arena.balls[0]?.heldTicks).toBeGreaterThan(0);
    expect(countEvents(world, 120 * 2, 'launch')).toBe(1);
  });

  it('merges a second ball arriving in a busy ray', () => {
    const { world, arena } = shapeWorld('shape:star', 2);
    place(arena, 0, 0, -(arena.radius - 30), 0, -500);
    countEvents(world, 30, 'merge');
    place(arena, 1, 0, -(arena.radius - 40), 0, -500);
    expect(countEvents(world, 30, 'merge')).toBe(1);
  });
});
