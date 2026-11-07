import { detCos, detSin } from '../../core/detMath';
import { TICK_SECONDS } from '../constants';
import { spawnClone } from '../world';
import type { ShapeBehavior } from './behavior';
import { collideSide, createPolygon, type Polygon, type SideContact } from './polygon';

export interface TriangleState {
  kind: 'triangle';
  polygon: Polygon;
  cornerShare: number;
  cloneTicks: number;
  maxClones: number;
}

/** A split turns the ball and its clone this far apart, each to one side. */
const SPLIT_ANGLE = 0.35;
const SPLIT_COS = detCos(SPLIT_ANGLE);
const SPLIT_SIN = detSin(SPLIT_ANGLE);
const contact: SideContact = { x: 0, y: 0, along: 0, speed: 0 };

/**
 * Three straight sides. A hit near a corner is a corner hit: a permanent ball
 * splits off a clone that lives a few seconds.
 */
export const triangleBehavior: ShapeBehavior<TriangleState> = {
  create(def, radius) {
    if (!def.polygon || !def.triangle) throw new Error(`${def.id} has no triangle parameters`);
    return {
      kind: 'triangle',
      polygon: createPolygon(def.polygon, radius),
      cornerShare: def.triangle.cornerShare,
      cloneTicks: Math.round(def.triangle.cloneSeconds / TICK_SECONDS),
      maxClones: def.triangle.maxClones,
    };
  },

  step: () => undefined,

  collide(state, ball, context) {
    const { world, arena, arenaIndex, events } = context;
    for (let side = 0; side < state.polygon.sides; side++) {
      if (!collideSide(state.polygon, side, ball, arena.minBounceSpeed, contact)) continue;
      events.push('wall-hit', arenaIndex, contact.x, contact.y, contact.speed);
      const nearCorner = contact.along < state.cornerShare || contact.along > 1 - state.cornerShare;
      if (!nearCorner) continue;
      events.push('corner-hit', arenaIndex, contact.x, contact.y, contact.speed);
      if (ball.clone) continue;
      const { vx, vy } = ball;
      const clone = spawnClone(
        world,
        arena,
        ball,
        vx * SPLIT_COS - vy * SPLIT_SIN,
        vx * SPLIT_SIN + vy * SPLIT_COS,
        state.cloneTicks,
        state.maxClones,
      );
      if (!clone) continue;
      ball.vx = vx * SPLIT_COS + vy * SPLIT_SIN;
      ball.vy = -vx * SPLIT_SIN + vy * SPLIT_COS;
      events.push('split', arenaIndex, ball.x, ball.y, 0);
    }
  },

  spawnRadius: (state) => state.polygon.apothem,

  hash(state, hasher) {
    hasher.addNumber(state.polygon.apothem);
  },
};
