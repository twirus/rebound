export type ShapeId = `shape:${string}`;
export type BallId = `ball:${string}`;
export type GemId = `gem:${string}` | `law:${string}` | `link:${string}`;
export type NodeId = `node:${string}`;
export type ResourceId = `resource:${string}`;
export type GroupId = `group:${string}`;

/** Key in i18n/ru.json and i18n/en.json. */
export type TextKey = string;

export type Tag =
  | 'hit'
  | 'corner'
  | 'split'
  | 'portal'
  | 'link'
  | 'color'
  | 'break'
  | 'escape'
  | 'time'
  | 'gravity'
  | 'rhythm'
  | 'charge'
  | 'merge'
  | 'cold'
  | 'heat'
  | 'control';

export interface ResourceDef {
  id: ResourceId;
  nameKey: TextKey;
  /** "N <resource> per second" with a {value} placeholder; separate key for grammatical case. */
  perSecondKey: TextKey;
  color: string;
}

export interface ShapeDef {
  id: ShapeId;
  nameKey: TextKey;
  tags: readonly Tag[];
  resource: ResourceId;
  /** Arena radius in world units. */
  radius: number;
}

export interface BallDef {
  id: BallId;
  nameKey: TextKey;
  tags: readonly Tag[];
  /** Ball radius in world units. */
  radius: number;
  /** Multiplier on arena gravity. */
  gravityScale: number;
  color: string;
}

export type GemKind = 'event' | 'effect' | 'support' | 'condition' | 'law' | 'link';

export interface GemDef {
  id: GemId;
  kind: GemKind;
  nameKey: TextKey;
  descriptionKey: TextKey;
  downsideKey: TextKey;
  tags: readonly Tag[];
  load: number;
}

export type BranchId = `branch:${string}`;

export interface BranchDef {
  id: BranchId;
  nameKey: TextKey;
  /** Muted colour of the branch stripe in the tree. */
  color: string;
}

/** Numbers derived from bought nodes. Base values live in game/balance.ts. */
export type StatId =
  | 'stat:ball-count'
  | 'stat:ball-limit'
  | 'stat:impulse-per-hit'
  | 'stat:impulse-per-collision'
  | 'stat:min-bounce-speed'
  | 'stat:arena-scale'
  | 'stat:tap-strength'
  | 'stat:tap-cooldown'
  | 'stat:auto-tap'
  | 'stat:auto-tap-interval'
  | 'stat:auto-tap-power'
  | 'stat:tap-reach'
  | 'stat:tap-echo'
  | 'stat:impulse-multiplier';

/** Price of level L is ceil(base × growth^L). */
export interface NodeCost {
  resource: ResourceId;
  base: number;
  growth: number;
}

/** Added to a stat once per bought level. */
export interface StatModifier {
  stat: StatId;
  add: number;
}

/** Simple line icon drawn by the UI from its id; no image files. */
export type IconId =
  | 'ball'
  | 'hit'
  | 'collision'
  | 'speed'
  | 'arena'
  | 'limit'
  | 'tap'
  | 'cooldown'
  | 'reach'
  | 'auto'
  | 'echo'
  | 'amplifier'
  | 'triangle'
  | 'square'
  | 'hexagon'
  | 'mass'
  | 'gem'
  | 'link'
  | 'clock'
  | 'note'
  | 'core';

/**
 * unlock — opens something new, shown as a large card;
 * upgrade — a level row inside a group of upgrades;
 * key — changes a rule of the game, shown as a large card with a key mark.
 */
export type NodeKind = 'unlock' | 'upgrade' | 'key';

/** Extra gate on top of `requires`. */
export type NodeCondition =
  | { kind: 'stat-at-least'; stat: StatId; value: number }
  | { kind: 'levels-bought'; value: number }
  /** Content of a later version: always a silhouette, never buyable. */
  | { kind: 'future' };

export interface TreeNodeDef {
  id: NodeId;
  branch: BranchId;
  kind: NodeKind;
  /** Required for upgrades: the group row they are listed in. */
  group?: GroupId;
  icon: IconId;
  nameKey: TextKey;
  descriptionKey: TextKey;
  /** Empty for a branch root. Layout is derived from these links; no coordinates in data. */
  requires: readonly NodeId[];
  /** 'all' (default) — every requirement bought; 'any' — at least one. */
  requiresMode?: 'all' | 'any';
  conditions?: readonly NodeCondition[];
  maxLevel: number;
  costs: readonly NodeCost[];
  effects: readonly StatModifier[];
}

/** Box of upgrade rows; its place in the tree follows from its members' requirements. */
export interface TreeGroupDef {
  id: GroupId;
  branch: BranchId;
  nameKey: TextKey;
}

export interface StatDef {
  id: StatId;
  nameKey: TextKey;
}
