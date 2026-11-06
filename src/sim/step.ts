import { stepArena } from './physics';
import type { World } from './world';

export function stepWorld(world: World): void {
  world.tick += 1;
  for (const arena of world.arenas) {
    stepArena(arena);
  }
}
