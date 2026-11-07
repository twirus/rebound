import type { Ball } from './ball';
import type { Arena, World } from './world';

/**
 * Adds a short-lived copy of `source` moving along (vx, vy). Returns null when
 * the arena already holds `maxClones` clones.
 */
export function spawnClone(
  world: World,
  arena: Arena,
  source: Ball,
  vx: number,
  vy: number,
  lifeTicks: number,
  maxClones: number,
): Ball | null {
  let clones = 0;
  for (const ball of arena.balls) if (ball.clone) clones += 1;
  if (clones >= maxClones) return null;
  const clone: Ball = { ...source, id: world.nextBallId, vx, vy, clone: true, lifeTicks };
  world.nextBallId += 1;
  arena.balls.push(clone);
  return clone;
}

/** Drops clones whose time is up, keeping the order of the rest. */
export function expireClones(arena: Arena): void {
  let kept = 0;
  for (const ball of arena.balls) {
    if (ball.clone) ball.lifeTicks -= 1;
    if (ball.clone && ball.lifeTicks <= 0) continue;
    arena.balls[kept] = ball;
    kept += 1;
  }
  arena.balls.length = kept;
}

/** Balls that stay: everything except clones. */
export function permanentBallCount(arena: Arena): number {
  let count = 0;
  for (const ball of arena.balls) if (!ball.clone) count += 1;
  return count;
}
