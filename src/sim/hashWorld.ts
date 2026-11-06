import { StateHasher } from '../core/hash';
import type { World } from './world';

/** Fingerprint of everything that affects future simulation. Used by the determinism test. */
export function hashWorld(world: World): string {
  const hasher = new StateHasher();
  hasher.addNumber(world.tick);
  hasher.addNumber(world.rng.getState());
  hasher.addNumber(world.nextBallId);
  for (const arena of world.arenas) {
    hasher.addNumber(arena.radius);
    hasher.addNumber(arena.minBounceSpeed);
    hasher.addNumber(arena.balls.length);
    for (const ball of arena.balls) {
      hasher.addNumber(ball.id);
      hasher.addNumber(ball.x);
      hasher.addNumber(ball.y);
      hasher.addNumber(ball.vx);
      hasher.addNumber(ball.vy);
      hasher.addNumber(ball.radius);
    }
  }
  return hasher.digest();
}
