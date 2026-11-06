import { stepArena } from './physics';
import { applyPendingPushes } from './push';
import type { World } from './world';

/** Advances one fixed tick. Events of this tick stay in `world.events` until the next call. */
export function stepWorld(world: World): void {
  world.tick += 1;
  world.events.clear();
  applyPendingPushes(world);
  world.arenas.forEach((arena, arenaIndex) => stepArena(arena, arenaIndex, world.events));
}
