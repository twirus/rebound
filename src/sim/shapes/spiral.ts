import { detCos, detSin } from '../../core/detMath';
import { TICK_SECONDS } from '../constants';
import type { ShapeBehavior } from './behavior';
import { bounceInsideCircle } from './walls';

export interface SpiralState {
  kind: 'spiral';
  pull: number;
  swirl: number;
  drag: number;
  coreRadius: number;
  throwSpeed: number;
}

/** Angle between straight out and the direction a ball leaves the core. */
const THROW_ANGLE = 0.9;
const THROW_COS = detCos(THROW_ANGLE);
const THROW_SIN = detSin(THROW_ANGLE);

/**
 * A round wall with a pull towards the centre, a sideways swirl and a little
 * drag, so orbits decay and balls spiral in. A ball reaching the core earns Chronos and is thrown back out.
 */
export const spiralBehavior: ShapeBehavior<SpiralState> = {
  create(def) {
    const params = def.spiral;
    if (!params) throw new Error(`${def.id} has no spiral parameters`);
    return { kind: 'spiral', ...params };
  },

  step(state, { arena, arenaIndex, events }) {
    for (const ball of arena.balls) {
      const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
      if (distance === 0) continue;
      const normalX = ball.x / distance;
      const normalY = ball.y / distance;
      const inward = ball.vx * normalX + ball.vy * normalY < 0;
      if (distance < state.coreRadius && inward) {
        events.push('core-reach', arenaIndex, ball.x, ball.y, distance);
        // Thrown out at a slant, so the way back in is a spiral, not a straight line.
        ball.vx = (normalX * THROW_COS - normalY * THROW_SIN) * state.throwSpeed;
        ball.vy = (normalX * THROW_SIN + normalY * THROW_COS) * state.throwSpeed;
        continue;
      }
      // Pull inward, plus a sideways push along (−y, x) that grows with the inward
      // speed: falling curls into a spiral, but no orbit can feed itself.
      const curl = state.swirl * Math.max(0, -(ball.vx * normalX + ball.vy * normalY));
      ball.vx += (-normalX * state.pull - normalY * curl) * TICK_SECONDS;
      ball.vy += (-normalY * state.pull + normalX * curl) * TICK_SECONDS;
      // Drag only on the sideways part: the spin dies down, the fall inward does not.
      const sideways = ball.vy * normalX - ball.vx * normalY;
      const lost = sideways * state.drag * TICK_SECONDS;
      ball.vx += normalY * lost;
      ball.vy -= normalX * lost;
    }
  },

  collide(_state, ball, { arena, arenaIndex, events }) {
    const speed = bounceInsideCircle(ball, arena.radius, arena.minBounceSpeed);
    if (speed === 0) return;
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    const hitX = (ball.x / distance) * arena.radius;
    const hitY = (ball.y / distance) * arena.radius;
    events.push('wall-hit', arenaIndex, hitX, hitY, speed);
  },

  spawnRadius: (_state, arenaRadius) => arenaRadius,

  hash(state, hasher) {
    hasher.addNumber(state.pull);
    hasher.addNumber(state.swirl);
  },
};
