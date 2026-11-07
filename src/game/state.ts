import { resources } from '../content/resources';
import type { BallId, NodeId, ResourceId, ShapeId } from '../content/types';

export type ResourceTable = Record<ResourceId, number>;
export type NodeLevels = Partial<Record<NodeId, number>>;

/** What the player picked for an arena in the arena panel. */
export interface ArenaSetup {
  shape: ShapeId;
  ball: BallId;
}

/** Everything that survives a reload. The world itself is rebuilt from it. */
export interface GameState {
  resources: ResourceTable;
  nodeLevels: NodeLevels;
  arena: ArenaSetup;
}

export const DEFAULT_ARENA: ArenaSetup = { shape: 'shape:circle', ball: 'ball:basic' };

export function emptyResources(): ResourceTable {
  return Object.fromEntries(resources.map((resource) => [resource.id, 0]));
}

export function newGameState(): GameState {
  return { resources: emptyResources(), nodeLevels: {}, arena: { ...DEFAULT_ARENA } };
}

export function levelOf(levels: NodeLevels, id: NodeId): number {
  return levels[id] ?? 0;
}
