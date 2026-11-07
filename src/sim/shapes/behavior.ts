import type { Rng } from '../../core/rng';
import type { StateHasher } from '../../core/hash';
import type { ShapeDef } from '../../content/types';
import type { SimEventBuffer } from '../events';
import type { Arena, Ball } from '../world';
import type { CircleState } from './circle';
import type { RingsState } from './rings';

/** Runtime state of an arena's walls; one member per shape kind. */
export type ShapeState = CircleState | RingsState;

/** What a wall behaviour may touch during a tick. Reused, never stored. */
export interface ShapeContext {
  arena: Arena;
  arenaIndex: number;
  events: SimEventBuffer;
  rng: Rng;
}

export interface ShapeBehavior<State extends ShapeState> {
  /** Builds walls for an arena of the given radius from the (possibly upgraded) definition. */
  create(def: ShapeDef, radius: number): State;
  /** Moves walls, regrows broken parts; once per tick before the balls move. */
  step(state: State, context: ShapeContext): void;
  /** Keeps one ball in or lets it through; every substep after the ball moved. */
  collide(state: State, ball: Ball, context: ShapeContext): void;
  /** Radius of the free space around the centre where new balls may appear. */
  spawnRadius(state: State, arenaRadius: number): number;
  /** Adds everything that affects future ticks to the determinism fingerprint. */
  hash(state: State, hasher: StateHasher): void;
}
