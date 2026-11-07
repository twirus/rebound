import { Rng } from '../core/rng';
import { balls } from '../content/balls';
import { shapes } from '../content/shapes';
import type { BallDef, BallId, ShapeDef, ShapeId } from '../content/types';
import { SimEventBuffer } from './events';
import type { PushInput } from './push';
import { createShapeState, shapeSpawnRadius, type ShapeState } from './shapes';

export interface Ball {
  id: number;
  typeId: BallId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Position at the start of the current tick, for render interpolation. */
  prevX: number;
  prevY: number;
  radius: number;
  mass: number;
  gravityScale: number;
  /** A temporary copy (triangle split); clones never split again. */
  clone: boolean;
  /** Ticks a clone has left; 0 for permanent balls. */
  lifeTicks: number;
  /** Colour index picked up from a coloured wall, −1 for none. */
  tint: number;
  /** Hits in a row on walls of the current tint. */
  streak: number;
  /** Ticks left pinned in a star ray, charging; 0 when free. */
  heldTicks: number;
  /** The ray holding the ball, −1 when free. */
  heldSlot: number;
}

export interface Arena {
  shapeId: ShapeId;
  /** Outer radius of the arena walls, world units, centre at (0, 0). */
  radius: number;
  /** A ball leaving a wall slower than this is kicked up to it. */
  minBounceSpeed: number;
  /** Multiplier on downward gravity, from the shape. */
  gravity: number;
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

export function findBall(id: BallId): BallDef {
  const ball = balls.find((candidate) => candidate.id === id);
  if (!ball) throw new Error(`Unknown ball ${id}`);
  return ball;
}

export function createWorld(seed: number): World {
  const shape = findShape(START_SHAPE);
  const arena: Arena = {
    shapeId: shape.id,
    radius: shape.radius,
    minBounceSpeed: 0,
    gravity: shape.gravity ?? 1,
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

/** Gives the ball the size and physics of its type, scaled for the arena's shape. */
export function applyBallType(ball: Ball, typeId: BallId, arena: Arena): void {
  const def = findBall(typeId);
  const radius = def.radius * (findShape(arena.shapeId).ballScale ?? 1);
  ball.typeId = typeId;
  ball.radius = radius;
  ball.mass = radius * radius;
  ball.gravityScale = def.gravityScale;
}

export function spawnBall(world: World, arena: Arena, typeId: BallId): Ball {
  const ball: Ball = {
    id: world.nextBallId,
    typeId,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    prevX: 0,
    prevY: 0,
    radius: 0,
    mass: 0,
    gravityScale: 0,
    clone: false,
    lifeTicks: 0,
    tint: -1,
    streak: 0,
    heldTicks: 0,
    heldSlot: -1,
  };
  applyBallType(ball, typeId, arena);
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
    applyBallType(ball, ball.typeId, arena);
    ball.tint = -1;
    ball.streak = 0;
    ball.heldTicks = 0;
    ball.heldSlot = -1;
    placeInSpawnArea(world, arena, ball);
  }
}
