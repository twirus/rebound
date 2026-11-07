import { Rng } from '../core/rng';
import { shapes } from '../content/shapes';
import type { BallId, ShapeDef, ShapeId } from '../content/types';
import { applyBallType, clearBallState, newBall, type Ball } from './ball';
import { SimEventBuffer } from './events';
import type { Scheme } from './gems/scheme';
import type { PushInput } from './push';
import { createShapeState, shapeSpawnRadius, type ShapeState } from './shapes';

export interface Arena {
  shapeId: ShapeId;
  /** Outer radius of the arena walls, world units, centre at (0, 0). */
  radius: number;
  /** A ball leaving a wall slower than this is kicked up to it. */
  minBounceSpeed: number;
  /** Multiplier on gravity, from the shape. */
  gravity: number;
  /** Which way gravity pulls: 0 down, 1 left, 2 up, 3 right (gems can turn it). */
  gravityDirection: number;
  /** Ticks since the last wall hit, for the "quiet" trigger. */
  quietTicks: number;
  /** Gem schemes running in this arena, in slot order. */
  schemes: Scheme[];
  shape: ShapeState;
  balls: Ball[];
}

export interface World {
  tick: number;
  rng: Rng;
  arenas: Arena[];
  events: SimEventBuffer;
  nextBallId: number;
  pendingPushes: PushInput[];
}

const START_SHAPE: ShapeId = 'shape:circle';
/** Horizontal launch speed range for new balls, world units per second. */
const SPAWN_SPEED = 180;
/** New balls appear in the upper part of the free space, within this share of its radius. */
const SPAWN_SPREAD = 0.5;

export function findShape(id: ShapeId): ShapeDef {
  const shape = shapes.find((candidate) => candidate.id === id);
  if (!shape) throw new Error(`Unknown shape ${id}`);
  return shape;
}

export type { Ball } from './ball';
export { findBall } from './ball';

export function createWorld(seed: number): World {
  const shape = findShape(START_SHAPE);
  const arena: Arena = {
    shapeId: shape.id,
    radius: shape.radius,
    minBounceSpeed: 0,
    gravity: shape.gravity ?? 1,
    gravityDirection: 0,
    quietTicks: 0,
    schemes: [],
    shape: createShapeState(shape, shape.radius),
    balls: [],
  };
  return {
    tick: 0,
    rng: new Rng(seed),
    arenas: [arena],
    events: new SimEventBuffer(),
    nextBallId: 1,
    pendingPushes: [],
  };
}

function placeInSpawnArea(world: World, arena: Arena, ball: Ball): void {
  const spread = shapeSpawnRadius(arena.shape, arena.radius) * SPAWN_SPREAD;
  ball.x = world.rng.nextRange(-spread, spread);
  ball.y = world.rng.nextRange(-spread, 0);
  ball.prevX = ball.x;
  ball.prevY = ball.y;
}

/** Ball size in the arena's shape relative to the ball type. */
export function ballSizeScale(arena: Arena): number {
  return findShape(arena.shapeId).ballScale ?? 1;
}

export function spawnBall(world: World, arena: Arena, typeId: BallId): Ball {
  const ball = newBall(world.nextBallId, typeId, ballSizeScale(arena));
  placeInSpawnArea(world, arena, ball);
  ball.vx = world.rng.nextRange(-SPAWN_SPEED, SPAWN_SPEED);
  world.nextBallId += 1;
  arena.balls.push(ball);
  return ball;
}

/**
 * Adds a short-lived copy of `source` moving along (vx, vy). Returns null when
 * the arena already holds `maxClones` clones.
 */
export function spawnClone(
  world: World,
  arena: Arena,
  source: Ball,
  vx: number,
  vy: number,
  lifeTicks: number,
  maxClones: number,
): Ball | null {
  let clones = 0;
  for (const ball of arena.balls) if (ball.clone) clones += 1;
  if (clones >= maxClones) return null;
  const clone: Ball = { ...source, id: world.nextBallId, vx, vy, clone: true, lifeTicks };
  world.nextBallId += 1;
  arena.balls.push(clone);
  return clone;
}

/** Drops clones whose time is up, keeping the order of the rest. */
export function expireClones(arena: Arena): void {
  let kept = 0;
  for (const ball of arena.balls) {
    if (ball.clone) ball.lifeTicks -= 1;
    if (ball.clone && ball.lifeTicks <= 0) continue;
    arena.balls[kept] = ball;
    kept += 1;
  }
  arena.balls.length = kept;
}

/** Balls that stay: everything except clones. */
export function permanentBallCount(arena: Arena): number {
  let count = 0;
  for (const ball of arena.balls) if (!ball.clone) count += 1;
  return count;
}

/**
 * Rebuilds the walls from a (possibly upgraded) shape definition. When the
 * shape itself changes, balls are moved back into its free space.
 */
export function setArenaShape(world: World, arena: Arena, def: ShapeDef, radius: number): void {
  const shapeChanged = arena.shapeId !== def.id;
  arena.shapeId = def.id;
  arena.radius = radius;
  arena.gravity = def.gravity ?? 1;
  arena.shape = createShapeState(def, radius);
  if (!shapeChanged) return;
  arena.balls = arena.balls.filter((ball) => !ball.clone);
  for (const ball of arena.balls) {
    applyBallType(ball, ball.typeId, ballSizeScale(arena));
    clearBallState(ball);
    placeInSpawnArea(world, arena, ball);
  }
}
