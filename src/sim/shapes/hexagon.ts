import type { ShapeBehavior } from './behavior';
import { collideSide, createPolygon, type Polygon, type SideContact } from './polygon';

export interface HexagonState {
  kind: 'hexagon';
  polygon: Polygon;
  /** Sides take colours 0, 1, … in turn; a ball's tint is a colour index. */
  colorCount: number;
  comboLength: number;
}

const contact: SideContact = { x: 0, y: 0, along: 0, speed: 0 };

/**
 * Six sides in a few colours, opposite sides alike. A ball takes the colour of the side it hits;
 * hitting sides of its own colour again and again builds a streak, and every
 * hit from the combo length on is a combo.
 */
export const hexagonBehavior: ShapeBehavior<HexagonState> = {
  create(def, radius) {
    if (!def.polygon || !def.hexagon) throw new Error(`${def.id} has no hexagon parameters`);
    return {
      kind: 'hexagon',
      polygon: createPolygon(def.polygon, radius),
      colorCount: def.hexagon.colors.length,
      comboLength: def.hexagon.comboLength,
    };
  },

  step: () => undefined,

  collide(state, ball, { arena, arenaIndex, events }) {
    for (let side = 0; side < state.polygon.sides; side++) {
      if (!collideSide(state.polygon, side, ball, arena.minBounceSpeed, contact)) continue;
      events.push('wall-hit', arenaIndex, contact.x, contact.y, contact.speed, ball);
      const color = side % state.colorCount;
      if (ball.tint === color) {
        ball.streak += 1;
      } else {
        ball.tint = color;
        ball.streak = 1;
      }
      if (ball.streak >= state.comboLength) {
        events.push('combo', arenaIndex, contact.x, contact.y, ball.streak, ball);
      }
    }
  },

  spawnRadius: (state) => state.polygon.apothem,

  hash(state, hasher) {
    hasher.addNumber(state.comboLength);
  },
};
