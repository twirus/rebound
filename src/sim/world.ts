import { Rng } from '../core/rng';
import { balls } from '../content/balls';
import { shapes } from '../content/shapes';
import type { BallDef, BallId, ShapeDef, ShapeId } from '../content/types';
import { SimEventBuffer } from './events';
import type { PushInput } from './push';

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
}

export interface Arena {
  shapeId: ShapeId;
  /** Inner radius of the arena wall, world units, centre at (0, 0). */
  radius: number;
  /** A ball leaving a wall slower than this is kicked up to it. */
  minBounceSpeed: number;
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
/** New balls appear in the upper part of the arena, within this share of the radius. */
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
  const arena: Arena = { shapeId: shape.id, radius: shape.radius, minBounceSpeed: 0, balls: [] };
  return {
    tick: 0,
    rng: new Rng(seed),
    arenas: [arena],
    events: new SimEventBuffer(),
    nextBallId: 1,
    pendingPushes: [],
  };
}

export function spawnBall(world: World, arena: Arena, typeId: BallId): Ball {
  const def = findBall(typeId);
  const spread = arena.radius * SPAWN_SPREAD;
  const x = world.rng.nextRange(-spread, spread);
  const y = world.rng.nextRange(-spread, 0);
  const ball: Ball = {
    id: world.nextBallId,
    typeId,
    x,
    y,
    vx: world.rng.nextRange(-SPAWN_SPEED, SPAWN_SPEED),
    vy: 0,
    prevX: x,
    prevY: y,
    radius: def.radius,
    mass: def.radius * def.radius,
    gravityScale: def.gravityScale,
  };
  world.nextBallId += 1;
  arena.balls.push(ball);
  return ball;
}
