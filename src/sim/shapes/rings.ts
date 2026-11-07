import { detCos, detSin } from '../../core/detMath';
import type { ShapeDef } from '../../content/types';
import { TICK_SECONDS } from '../constants';
import type { Ball } from '../world';
import type { ShapeBehavior, ShapeContext } from './behavior';
import { bounceRadial, kickToMinSpeed } from './walls';

export interface Ring {
  radius: number;
  /** Unit vector pointing at the middle of the gap. */
  gapX: number;
  gapY: number;
  /** Rotation applied to the gap vector every tick. */
  turnCos: number;
  turnSin: number;
  broken: boolean;
  /** Ticks until a broken ring may grow back. */
  regrowLeft: number;
}

export interface RingsState {
  kind: 'rings';
  rings: Ring[];
  /** A ball whose direction is within the half-gap angle of the gap vector is in the gap. */
  gapCos: number;
  regrowTicks: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;
/**
 * Every gap starts here (straight up). Rings spin the same way at different
 * speeds, so the gaps fan out; reversing brings them back into line here.
 */
const GAP_START_ANGLE = -Math.PI / 2;
/** A ball counts as passing a gap once its centre is this share of its radius from the ring line. */
const PASS_SHARE = 0.5;
/** Escaped balls come back near the centre, within this share of the innermost radius. */
const RESPAWN_SPREAD = 0.3;
const RESPAWN_SPEED = 160;

function createRing(def: ShapeDef, radius: number, index: number, count: number): Ring {
  const params = def.rings;
  if (!params) throw new Error(`${def.id} has no ring parameters`);
  // Rings keep their proportions when the arena is scaled to `radius`.
  const outer = params.innerRadius + params.spacing * (count - 1);
  const ringRadius = (radius * (params.innerRadius + params.spacing * index)) / outer;
  const speed = params.degreesPerSecond * DEGREES_TO_RADIANS * (1 + params.speedStep * index);
  const turn = speed * TICK_SECONDS;
  return {
    radius: ringRadius,
    gapX: detCos(GAP_START_ANGLE),
    gapY: detSin(GAP_START_ANGLE),
    turnCos: detCos(turn),
    turnSin: detSin(turn),
    broken: false,
    regrowLeft: 0,
  };
}

function rotateGap(ring: Ring): void {
  const x = ring.gapX * ring.turnCos - ring.gapY * ring.turnSin;
  const y = ring.gapX * ring.turnSin + ring.gapY * ring.turnCos;
  // Renormalising every tick stops rounding from slowly shrinking the vector.
  const length = Math.sqrt(x * x + y * y);
  ring.gapX = x / length;
  ring.gapY = y / length;
}

/** Every break flips the spin of all rings: the gaps wind back towards their shared start. */
function reverseAll(state: RingsState): void {
  for (const ring of state.rings) ring.turnSin = -ring.turnSin;
}

function ringIsClear(ring: Ring, balls: readonly Ball[]): boolean {
  return balls.every((ball) => {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    return Math.abs(distance - ring.radius) > ball.radius;
  });
}

function respawn(ball: Ball, state: RingsState, context: ShapeContext): void {
  const { rng } = context;
  const spread = ringsBehavior.spawnRadius(state, context.arena.radius) * RESPAWN_SPREAD;
  ball.x = rng.nextRange(-spread, spread);
  ball.y = rng.nextRange(-spread, spread);
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.vx = rng.nextRange(-RESPAWN_SPEED, RESPAWN_SPEED);
  ball.vy = -RESPAWN_SPEED;
}

/**
 * Every ring is gone: the round is won. All rings come back with their gaps in
 * line and spinning forward again, and the balls return to the centre.
 */
function startNewRound(state: RingsState, context: ShapeContext): void {
  for (const ring of state.rings) {
    ring.broken = false;
    ring.regrowLeft = 0;
    ring.gapX = detCos(GAP_START_ANGLE);
    ring.gapY = detSin(GAP_START_ANGLE);
    ring.turnSin = Math.abs(ring.turnSin);
  }
  for (const ball of context.arena.balls) respawn(ball, state, context);
  const { events, arenaIndex } = context;
  events.push('round-reset', arenaIndex, 0, 0, state.rings.length);
}

/** Returns true when the ball hit or broke this ring, so outer rings need no check. */
function touchRing(
  ring: Ring,
  ball: Ball,
  distance: number,
  state: RingsState,
  context: ShapeContext,
): boolean {
  const offset = distance - ring.radius;
  if (Math.abs(offset) >= ball.radius) return false;
  const normalX = ball.x / distance;
  const normalY = ball.y / distance;
  if (normalX * ring.gapX + normalY * ring.gapY > state.gapCos) {
    if (Math.abs(offset) < ball.radius * PASS_SHARE) {
      ring.broken = true;
      ring.regrowLeft = state.regrowTicks;
      reverseAll(state);
      const { events, arenaIndex } = context;
      const x = ring.gapX * ring.radius;
      const y = ring.gapY * ring.radius;
      events.push('ring-break', arenaIndex, x, y, ring.radius);
      // Only breaking out through the last ring counts as an escape, so falling
      // through rings that are already broken earns nothing.
      if (ring === state.rings[state.rings.length - 1]) {
        events.push('escape', arenaIndex, x, y, ring.radius);
      }
    }
    return true;
  }
  const inside = offset < 0;
  const target = inside ? ring.radius - ball.radius : ring.radius + ball.radius;
  const speed = bounceRadial(ball, normalX, normalY, target, inside ? 1 : -1);
  if (speed > 0) {
    kickToMinSpeed(ball, context.arena.minBounceSpeed);
    const { events, arenaIndex } = context;
    events.push('wall-hit', arenaIndex, normalX * ring.radius, normalY * ring.radius, speed);
  }
  return true;
}

/**
 * Nested rotating rings with one gap each. Passing a gap shatters the ring; it
 * grows back later. Shattering the outermost ring is an escape. Any ball that
 * ends up outside every ring returns to the centre.
 */
export const ringsBehavior: ShapeBehavior<RingsState> = {
  create(def, radius) {
    const params = def.rings;
    if (!params) throw new Error(`${def.id} has no ring parameters`);
    const count = Math.max(1, Math.round(params.count));
    return {
      kind: 'rings',
      rings: Array.from({ length: count }, (_, index) => createRing(def, radius, index, count)),
      gapCos: detCos((params.gapDegrees / 2) * DEGREES_TO_RADIANS),
      regrowTicks: Math.round(params.regrowSeconds / TICK_SECONDS),
    };
  },

  step(state, context) {
    if (state.rings.every((ring) => ring.broken)) {
      startNewRound(state, context);
      return;
    }
    for (const ring of state.rings) {
      rotateGap(ring);
      if (!ring.broken) continue;
      ring.regrowLeft -= 1;
      if (ring.regrowLeft <= 0 && ringIsClear(ring, context.arena.balls)) ring.broken = false;
    }
  },

  collide(state, ball, context) {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    if (distance === 0) return;
    for (const ring of state.rings) {
      if (!ring.broken && touchRing(ring, ball, distance, state, context)) return;
    }
    if (distance > context.arena.radius + ball.radius * 2) respawn(ball, state, context);
  },

  spawnRadius: (state, arenaRadius) => state.rings[0]?.radius ?? arenaRadius,

  hash(state, hasher) {
    for (const ring of state.rings) {
      hasher.addNumber(ring.radius);
      hasher.addNumber(ring.gapX);
      hasher.addNumber(ring.gapY);
      hasher.addNumber(ring.broken ? 1 : 0);
      hasher.addNumber(ring.regrowLeft);
    }
  },
};
