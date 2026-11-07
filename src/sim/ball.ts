import { balls } from '../content/balls';
import type { BallDef, BallId, BallKind } from '../content/types';
import { MAX_BALL_SPEED } from './constants';

/** What a ball is doing besides flying. */
export const BallStatus = {
  free: 0,
  /** Sticky ball glued to a wall; moves on when the status ends. */
  stuck: 1,
  /** Frozen by a frost ball; hangs still until the status ends. */
  frozen: 2,
  /** Passing through walls for a moment (phantom, molten ember). */
  phasing: 3,
} as const;
export type BallStatus = (typeof BallStatus)[keyof typeof BallStatus];

export interface Ball {
  id: number;
  typeId: BallId;
  /** Behaviour of the type, copied here so hot code needs no lookup. */
  kind: BallKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Position at the start of the current tick, for render interpolation. */
  prevX: number;
  prevY: number;
  radius: number;
  /** Radius of the type in this shape, before gem growth or shrinking. */
  baseRadius: number;
  mass: number;
  gravityScale: number;
  maxSpeed: number;
  /** Takes part in ball-to-ball collisions. */
  solid: boolean;
  /** A temporary copy (triangle split, seed hatchling); copies never multiply again. */
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
  status: BallStatus;
  /** Ticks until the status ends. */
  statusTicks: number;
  /** Wall hits counted by types that act every N hits. */
  hits: number;
  /** Ember heat. */
  heat: number;
  /** Velocity to resume with when a stuck ball comes free. */
  storedVx: number;
  storedVy: number;
  /** Already reported as nearly stopped / at top speed; cleared once it recovers. */
  slow: boolean;
  fast: boolean;
}

export function findBall(id: BallId): BallDef {
  const ball = balls.find((candidate) => candidate.id === id);
  if (!ball) throw new Error(`Unknown ball ${id}`);
  return ball;
}

/** Gives the ball the size and physics of its type; `sizeScale` comes from the shape. */
export function applyBallType(ball: Ball, typeId: BallId, sizeScale: number): void {
  const def = findBall(typeId);
  const radius = def.radius * sizeScale;
  ball.typeId = typeId;
  ball.kind = def.kind;
  ball.radius = radius;
  ball.baseRadius = radius;
  ball.mass = radius * radius;
  ball.gravityScale = def.gravityScale;
  ball.maxSpeed = MAX_BALL_SPEED * (def.speedScale ?? 1);
  ball.solid = def.solid ?? true;
}

/** A ball of the given type at rest at the origin, with every status cleared. */
export function newBall(id: number, typeId: BallId, sizeScale: number): Ball {
  const ball: Ball = {
    id,
    typeId,
    kind: 'basic',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    prevX: 0,
    prevY: 0,
    radius: 0,
    baseRadius: 0,
    mass: 0,
    gravityScale: 0,
    maxSpeed: MAX_BALL_SPEED,
    solid: true,
    clone: false,
    lifeTicks: 0,
    tint: -1,
    streak: 0,
    heldTicks: 0,
    heldSlot: -1,
    status: BallStatus.free,
    statusTicks: 0,
    hits: 0,
    heat: 0,
    storedVx: 0,
    storedVy: 0,
    slow: false,
    fast: false,
  };
  applyBallType(ball, typeId, sizeScale);
  return ball;
}

/** Sets the ball's radius to `factor` × its base radius; mass follows. */
export function resizeBall(ball: Ball, factor: number): void {
  ball.radius = ball.baseRadius * factor;
  ball.mass = ball.radius * ball.radius;
}

/** Clears everything a shape or another ball did to the ball. */
export function clearBallState(ball: Ball): void {
  ball.tint = -1;
  ball.streak = 0;
  ball.heldTicks = 0;
  ball.heldSlot = -1;
  ball.status = BallStatus.free;
  ball.statusTicks = 0;
  ball.hits = 0;
  ball.heat = 0;
}
