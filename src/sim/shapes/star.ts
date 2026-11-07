import { detCos, detSin } from '../../core/detMath';
import { TICK_SECONDS } from '../constants';
import type { Ball } from '../world';
import type { ShapeBehavior, ShapeContext } from './behavior';
import { bounceInsideCircle, respawnNearCentre } from './walls';

export interface StarState {
  kind: 'star';
  /** Unit direction of each ray. */
  raysX: number[];
  raysY: number[];
  /** A ball whose direction is within this cosine of a ray is in that ray. */
  rayCos: number;
  /** Id of the ball charging in each ray, −1 when the ray is empty. */
  heldBy: number[];
  chargeTicks: number;
  launchSpeed: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;
/** The first ray points straight up. */
const FIRST_RAY_ANGLE = -Math.PI / 2;
/** A merged ball comes back near the centre, within this share of the radius. */
const RESPAWN_SHARE = 0.2;
const RESPAWN_SPEED = 160;

function rayAt(state: StarState, normalX: number, normalY: number): number {
  for (let ray = 0; ray < state.raysX.length; ray++) {
    const facing = normalX * (state.raysX[ray] ?? 0) + normalY * (state.raysY[ray] ?? 0);
    if (facing > state.rayCos) return ray;
  }
  return -1;
}

/** Keeps a charging ball still at the end of its ray. */
function pin(state: StarState, ball: Ball, radius: number): void {
  const reach = radius - ball.radius;
  ball.x = (state.raysX[ball.heldSlot] ?? 0) * reach;
  ball.y = (state.raysY[ball.heldSlot] ?? 0) * reach;
  ball.vx = 0;
  ball.vy = 0;
}

/** A free ball reached the wall inside a ray: it sticks, or merges into the one already there. */
function enterRay(state: StarState, ball: Ball, ray: number, context: ShapeContext): void {
  const { arena, arenaIndex, events, rng } = context;
  if (state.heldBy[ray] !== -1) {
    events.push('merge', arenaIndex, ball.x, ball.y, ball.radius);
    respawnNearCentre(ball, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
    return;
  }
  state.heldBy[ray] = ball.id;
  ball.heldSlot = ray;
  ball.heldTicks = state.chargeTicks;
  pin(state, ball, arena.radius);
}

/**
 * A round wall with rays. A ball reaching the wall inside a ray sticks there
 * and charges, then fires back across the arena. A second ball arriving in an
 * occupied ray merges into the first and earns Mass.
 */
export const starBehavior: ShapeBehavior<StarState> = {
  create(def) {
    const params = def.star;
    if (!params) throw new Error(`${def.id} has no star parameters`);
    const step = (Math.PI * 2) / params.rays;
    const angles = Array.from({ length: params.rays }, (_, ray) => FIRST_RAY_ANGLE + step * ray);
    return {
      kind: 'star',
      raysX: angles.map(detCos),
      raysY: angles.map(detSin),
      rayCos: detCos((params.rayDegrees / 2) * DEGREES_TO_RADIANS),
      heldBy: angles.map(() => -1),
      chargeTicks: Math.round(params.chargeSeconds / TICK_SECONDS),
      launchSpeed: params.launchSpeed,
    };
  },

  step(state, { arena, arenaIndex, events }) {
    for (const ball of arena.balls) {
      if (ball.heldTicks <= 0) continue;
      ball.heldTicks -= 1;
      if (ball.heldTicks > 0) continue;
      const ray = ball.heldSlot;
      ball.vx = -(state.raysX[ray] ?? 0) * state.launchSpeed;
      ball.vy = -(state.raysY[ray] ?? 0) * state.launchSpeed;
      state.heldBy[ray] = -1;
      ball.heldSlot = -1;
      events.push('launch', arenaIndex, ball.x, ball.y, state.launchSpeed);
    }
  },

  collide(state, ball, context) {
    const { arena, arenaIndex, events } = context;
    if (ball.heldTicks > 0) {
      pin(state, ball, arena.radius);
      return;
    }
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    if (distance <= arena.radius - ball.radius || distance === 0) return;
    const ray = rayAt(state, ball.x / distance, ball.y / distance);
    if (ray !== -1) {
      enterRay(state, ball, ray, context);
      return;
    }
    const speed = bounceInsideCircle(ball, arena.radius, arena.minBounceSpeed);
    if (speed === 0) return;
    const hitX = (ball.x / distance) * arena.radius;
    const hitY = (ball.y / distance) * arena.radius;
    events.push('wall-hit', arenaIndex, hitX, hitY, speed);
  },

  spawnRadius: (_state, arenaRadius) => arenaRadius,

  hash(state, hasher) {
    for (const holder of state.heldBy) hasher.addNumber(holder);
  },
};
