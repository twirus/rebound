import type { StateHasher } from '../../core/hash';
import type { ShapeDef, ShapeKind } from '../../content/types';
import type { Ball } from '../world';
import type { ShapeBehavior, ShapeContext, ShapeState } from './behavior';
import { circleBehavior } from './circle';
import { hexagonBehavior } from './hexagon';
import { mosaicBehavior } from './mosaic';
import { ringsBehavior } from './rings';
import { spiralBehavior } from './spiral';
import { squareBehavior } from './square';
import { starBehavior } from './star';
import { triangleBehavior } from './triangle';

/** Every wall behaviour, by the `kind` used in content/shapes.ts. */
const behaviors: { [Kind in ShapeKind]: ShapeBehavior<Extract<ShapeState, { kind: Kind }>> } = {
  circle: circleBehavior,
  rings: ringsBehavior,
  triangle: triangleBehavior,
  square: squareBehavior,
  hexagon: hexagonBehavior,
  mosaic: mosaicBehavior,
  spiral: spiralBehavior,
  star: starBehavior,
};

/*
 * TypeScript cannot tie a state to the behaviour picked by its own `kind`;
 * the table above guarantees they match, so the widening here is safe.
 */
function behaviorOf(state: ShapeState): ShapeBehavior<ShapeState> {
  return behaviors[state.kind] as ShapeBehavior<ShapeState>;
}

export function createShapeState(def: ShapeDef, radius: number): ShapeState {
  return behaviors[def.kind].create(def, radius);
}

export function stepShape(state: ShapeState, context: ShapeContext): void {
  behaviorOf(state).step(state, context);
}

export function collideShape(state: ShapeState, ball: Ball, context: ShapeContext): void {
  behaviorOf(state).collide(state, ball, context);
}

export function shapeSpawnRadius(state: ShapeState, arenaRadius: number): number {
  return behaviorOf(state).spawnRadius(state, arenaRadius);
}

export function hashShape(state: ShapeState, hasher: StateHasher): void {
  behaviorOf(state).hash(state, hasher);
}

export type { ShapeContext, ShapeState } from './behavior';
