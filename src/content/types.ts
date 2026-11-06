export type ShapeId = `shape:${string}`;
export type BallId = `ball:${string}`;
export type GemId = `gem:${string}` | `law:${string}` | `link:${string}`;
export type NodeId = `node:${string}`;
export type ResourceId = `resource:${string}`;

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
  | 'stat:auto-tap-interval';

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

export interface TreeNodeDef {
  id: NodeId;
  branch: BranchId;
  nameKey: TextKey;
  descriptionKey: TextKey;
  /** Empty for a branch root. Layout is derived from these links; no coordinates in data. */
  requires: readonly NodeId[];
  maxLevel: number;
  costs: readonly NodeCost[];
  effects: readonly StatModifier[];
}

export interface StatDef {
  id: StatId;
  nameKey: TextKey;
}
