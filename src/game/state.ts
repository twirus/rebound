import { resources } from '../content/resources';
import type { BallId, GemId, NodeId, ResourceId, ShapeId } from '../content/types';

export type ResourceTable = Record<ResourceId, number>;
export type NodeLevels = Partial<Record<NodeId, number>>;

/** What the player picked for an arena in the arena panel. */
/** One scheme row in the arena panel; a scheme runs once it has an event and an effect. */
export interface SchemeSlot {
  event: GemId | null;
  effect: GemId | null;
  supports: (GemId | null)[];
}

export interface ArenaSetup {
  shape: ShapeId;
  ball: BallId;
  /** As many rows as the arena has scheme slots; extra saved rows are kept but idle. */
  schemes: SchemeSlot[];
  law: GemId | null;
}

/** Everything that survives a reload. The world itself is rebuilt from it. */
export interface GameState {
  resources: ResourceTable;
  nodeLevels: NodeLevels;
  arena: ArenaSetup;
}

export const DEFAULT_ARENA: Readonly<ArenaSetup> = {
  shape: 'shape:circle',
  ball: 'ball:basic',
  schemes: [],
  law: null,
};

export function emptySchemeSlot(): SchemeSlot {
  return { event: null, effect: null, supports: [] };
}

export function emptyResources(): ResourceTable {
  return Object.fromEntries(resources.map((resource) => [resource.id, 0]));
}

export function newGameState(): GameState {
  return { resources: emptyResources(), nodeLevels: {}, arena: { ...DEFAULT_ARENA, schemes: [] } };
}

export function levelOf(levels: NodeLevels, id: NodeId): number {
  return levels[id] ?? 0;
}
