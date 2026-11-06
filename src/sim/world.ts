import { Rng } from '../core/rng';
import { balls } from '../content/balls';
import { shapes } from '../content/shapes';
import type { BallDef, BallId, ShapeDef, ShapeId } from '../content/types';

export interface Ball {
  typeId: BallId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Position at the start of the current tick, for render interpolation. */
  prevX: number;
  prevY: number;
  radius: number;
}

export interface Arena {
  shapeId: ShapeId;
  /** Inner radius of the arena wall, world units, centre at (0, 0). */
  radius: number;
  balls: Ball[];
}

export interface World {
  tick: number;
  rng: Rng;
  arenas: Arena[];
}

const START_SHAPE: ShapeId = 'shape:circle';
const START_BALL: BallId = 'ball:basic';
/** Horizontal launch speed range, world units per second. */
const START_SPEED = 180;

function findShape(id: ShapeId): ShapeDef {
  const shape = shapes.find((candidate) => candidate.id === id);
  if (!shape) throw new Error(`Unknown shape ${id}`);
  return shape;
}

export function findBall(id: BallId): BallDef {
  const ball = balls.find((candidate) => candidate.id === id);
  if (!ball) throw new Error(`Unknown ball ${id}`);
  return ball;
}

function spawnBall(rng: Rng, arenaRadius: number, typeId: BallId): Ball {
  const def = findBall(typeId);
  const x = rng.nextRange(-0.3, 0.3) * arenaRadius;
  const y = -0.3 * arenaRadius;
  return {
    typeId,
    x,
    y,
    vx: rng.nextRange(-START_SPEED, START_SPEED),
    vy: 0,
    prevX: x,
    prevY: y,
    radius: def.radius,
  };
}

export function createWorld(seed: number): World {
  const rng = new Rng(seed);
  const shape = findShape(START_SHAPE);
  const arena: Arena = { shapeId: shape.id, radius: shape.radius, balls: [] };
  arena.balls.push(spawnBall(rng, arena.radius, START_BALL));
  return { tick: 0, rng, arenas: [arena] };
}
