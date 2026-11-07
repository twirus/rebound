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

/** Which wall behaviour in sim/shapes/ runs the shape. */
export type ShapeKind = 'circle' | 'rings' | 'triangle' | 'square' | 'hexagon';

/** Regular polygon walls; the radius is the distance from the centre to a corner. */
export interface PolygonParams {
  sides: number;
  /** Direction of the first corner; -90 puts it straight up. */
  rotationDegrees: number;
}

/** A hit this close to a corner splits the ball; see sim/shapes/triangle.ts. */
export interface TriangleParams {
  /** Share of a side's length, measured from each end, that counts as the corner. */
  cornerShare: number;
  cloneSeconds: number;
  /** Clones alive at once in one arena. */
  maxClones: number;
}

/** One side is a portal to the opposite side; see sim/shapes/square.ts. */
export interface SquareParams {
  /** The portal moves one side clockwise after this many wall hits. */
  hitsPerShift: number;
}

/** Coloured sides; see sim/shapes/hexagon.ts. */
export interface HexagonParams {
  /** Sides take these colours in turn. */
  colors: readonly string[];
  /** Hits on same-coloured sides in a row that make a combo. */
  comboLength: number;
}

/** Nested rotating rings with one gap each; see sim/shapes/rings.ts. */
export interface RingsParams {
  count: number;
  /** Radius of the innermost ring, world units. */
  innerRadius: number;
  /** Distance between neighbouring rings; extra rings are added outward. */
  spacing: number;
  gapDegrees: number;
  /** Rotation of the innermost ring; all rings spin the same way, outer ones faster. */
  degreesPerSecond: number;
  /** Each next ring outward spins this share faster. */
  speedStep: number;
}

export interface ShapeDef {
  id: ShapeId;
  kind: ShapeKind;
  nameKey: TextKey;
  descriptionKey: TextKey;
  tags: readonly Tag[];
  resource: ResourceId;
  /** Arena radius in world units. */
  radius: number;
  /** Most balls this shape holds; the rest wait for a roomier shape. No limit when omitted. */
  maxBalls?: number;
  /** Ball size in this shape relative to the ball type; 1 when omitted. */
  ballScale?: number;
  rings?: RingsParams;
  polygon?: PolygonParams;
  triangle?: TriangleParams;
  square?: SquareParams;
  hexagon?: HexagonParams;
}

export interface BallDef {
  id: BallId;
  nameKey: TextKey;
  descriptionKey: TextKey;
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
  | 'stat:impulse-multiplier'
  | 'stat:ring-count'
  | 'stat:ring-gap'
  | 'stat:ring-spin'
  | 'stat:shards-per-break'
  | 'stat:shards-per-escape'
  | 'stat:corner-share'
  | 'stat:clone-seconds'
  | 'stat:impulse-per-corner'
  | 'stat:portal-shift'
  | 'stat:impulse-per-portal'
  | 'stat:combo-length'
  | 'stat:spectrum-per-combo';

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
  /** Shapes and ball types that become selectable in the arena panel once bought. */
  unlocks?: readonly (ShapeId | BallId)[];
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
