import { stepWorld } from '../../src/sim/step';
import { createWorld, spawnBall, type Arena, type World } from '../../src/sim/world';

export function worldWithBalls(seed: number, ballCount: number): { world: World; arena: Arena } {
  const world = createWorld(seed);
  const arena = world.arenas[0];
  if (!arena) throw new Error('No arena');
  for (let index = 0; index < ballCount; index++) spawnBall(world, arena, 'ball:basic');
  return { world, arena };
}

export function runTicks(world: World, ticks: number, onTick?: () => void): void {
  for (let tick = 0; tick < ticks; tick++) {
    stepWorld(world);
    onTick?.();
  }
}
