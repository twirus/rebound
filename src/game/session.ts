import { createWorld, type World } from '../sim/world';

const SEED_RANGE = 2 ** 32;

/** The seed is chosen outside sim/; the simulation itself never touches Math.random. */
export function createGameWorld(): World {
  return createWorld(Math.floor(Math.random() * SEED_RANGE));
}
