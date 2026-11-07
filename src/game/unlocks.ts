import { balls } from '../content/balls';
import { resources } from '../content/resources';
import { shapes } from '../content/shapes';
import { treeNodes } from '../content/tree';
import type { BallId, GemId, ResourceId, ShapeId } from '../content/types';
import { levelOf, type NodeLevels, type ResourceTable } from './state';

/** Content no node unlocks is available from the start. */
export function isContentUnlocked(id: ShapeId | BallId | GemId, levels: NodeLevels): boolean {
  const unlockers = treeNodes.filter((node) => node.unlocks?.includes(id));
  return unlockers.length === 0 || unlockers.some((node) => levelOf(levels, node.id) > 0);
}

export function unlockedShapes(levels: NodeLevels): ShapeId[] {
  return shapes.filter((shape) => isContentUnlocked(shape.id, levels)).map((shape) => shape.id);
}

export function unlockedBalls(levels: NodeLevels): BallId[] {
  return balls.filter((ball) => isContentUnlocked(ball.id, levels)).map((ball) => ball.id);
}

/** A resource shows up once a shape producing it is unlocked or some of it is owned. */
export function visibleResources(levels: NodeLevels, amounts: ResourceTable): ResourceId[] {
  const produced = new Set(
    shapes.filter((shape) => isContentUnlocked(shape.id, levels)).map((shape) => shape.resource),
  );
  return resources
    .filter((resource) => produced.has(resource.id) || (amounts[resource.id] ?? 0) > 0)
    .map((resource) => resource.id);
}
