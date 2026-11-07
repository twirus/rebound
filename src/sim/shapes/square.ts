import type { Ball } from '../world';
import type { ShapeBehavior } from './behavior';
import { beyondSide, collideSide, createPolygon, type Polygon, type SideContact } from './polygon';

export interface SquareState {
  kind: 'square';
  polygon: Polygon;
  /** The side that is a portal right now. */
  portalSide: number;
  hitsPerShift: number;
  hitsLeft: number;
}

const contact: SideContact = { x: 0, y: 0, along: 0, speed: 0 };

/** Moves a ball that crossed the portal to just inside the opposite side, same velocity. */
function teleport(state: SquareState, ball: Ball): void {
  const side = state.portalSide;
  const normalX = state.polygon.normalsX[side] ?? 0;
  const normalY = state.polygon.normalsY[side] ?? 0;
  const shift = beyondSide(state.polygon, side, ball.x, ball.y) + state.polygon.apothem * 2;
  const landing = shift - ball.radius;
  ball.x -= normalX * landing;
  ball.y -= normalY * landing;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
}

/**
 * Four sides; one is a portal. A ball crossing it comes out of the opposite
 * side. The portal moves one side clockwise every few wall hits.
 */
export const squareBehavior: ShapeBehavior<SquareState> = {
  create(def, radius) {
    if (!def.polygon || !def.square) throw new Error(`${def.id} has no square parameters`);
    return {
      kind: 'square',
      polygon: createPolygon(def.polygon, radius),
      portalSide: 0,
      hitsPerShift: def.square.hitsPerShift,
      hitsLeft: def.square.hitsPerShift,
    };
  },

  step: () => undefined,

  collide(state, ball, { arena, arenaIndex, events }) {
    for (let side = 0; side < state.polygon.sides; side++) {
      if (side === state.portalSide) {
        if (beyondSide(state.polygon, side, ball.x, ball.y) <= 0) continue;
        events.push('portal', arenaIndex, ball.x, ball.y, side);
        teleport(state, ball);
        continue;
      }
      if (!collideSide(state.polygon, side, ball, arena.minBounceSpeed, contact)) continue;
      events.push('wall-hit', arenaIndex, contact.x, contact.y, contact.speed);
      state.hitsLeft -= 1;
      if (state.hitsLeft > 0) continue;
      state.portalSide = (state.portalSide + 1) % state.polygon.sides;
      state.hitsLeft = state.hitsPerShift;
    }
  },

  spawnRadius: (state) => state.polygon.apothem,

  hash(state, hasher) {
    hasher.addNumber(state.portalSide);
    hasher.addNumber(state.hitsLeft);
  },
};
