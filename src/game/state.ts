import { resources } from '../content/resources';
import type { NodeId, ResourceId } from '../content/types';

export type ResourceTable = Record<ResourceId, number>;
export type NodeLevels = Partial<Record<NodeId, number>>;

/** Everything that survives a reload. The world itself is rebuilt from it. */
export interface GameState {
  resources: ResourceTable;
  nodeLevels: NodeLevels;
}

export function emptyResources(): ResourceTable {
  return Object.fromEntries(resources.map((resource) => [resource.id, 0]));
}

export function newGameState(): GameState {
  return { resources: emptyResources(), nodeLevels: {} };
}

export function levelOf(levels: NodeLevels, id: NodeId): number {
  return levels[id] ?? 0;
}
