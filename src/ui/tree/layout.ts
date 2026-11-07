import type { BranchId, GroupId, NodeId, TreeGroupDef, TreeNodeDef } from '../../content/types';

export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 92;
export const GROUP_HEADER_HEIGHT = 34;
export const GROUP_ROW_HEIGHT = 40;
export const COLUMN_GAP = 64;
export const ROW_GAP = 16;
/** Vertical gap between branch bands. */
export const BAND_GAP = 48;
export const COLUMN_WIDTH = CARD_WIDTH + COLUMN_GAP;

/** One box in the tree: a single card or a group of upgrade rows. */
export interface Placement {
  id: NodeId | GroupId;
  branch: BranchId;
  group: TreeGroupDef | null;
  nodes: readonly TreeNodeDef[];
  column: number;
  x: number;
  y: number;
  height: number;
}

export interface NodeLink {
  source: NodeId;
  target: NodeId;
}

export interface Edge {
  from: Placement['id'];
  to: Placement['id'];
  /** Requirement pairs behind the link; it lights up once both ends of a pair are bought. */
  links: readonly NodeLink[];
  path: string;
}

export interface Band {
  branch: BranchId;
  top: number;
  height: number;
  left: number;
}

export interface TreeLayout {
  placements: Placement[];
  edges: Edge[];
  bands: Band[];
  columns: number;
  width: number;
  height: number;
}

interface Box {
  id: Placement['id'];
  branch: BranchId;
  group: TreeGroupDef | null;
  nodes: TreeNodeDef[];
  /** Ids of boxes this box depends on, plus the node pairs behind each link. */
  parents: Map<Placement['id'], NodeLink[]>;
  height: number;
}

function buildBoxes(nodes: readonly TreeNodeDef[], groups: readonly TreeGroupDef[]): Box[] {
  const boxes = new Map<Placement['id'], Box>();
  const boxOf = new Map<NodeId, Placement['id']>();
  for (const node of nodes) {
    const group = node.group
      ? (groups.find((candidate) => candidate.id === node.group) ?? null)
      : null;
    const id = group ? group.id : node.id;
    boxOf.set(node.id, id);
    const box: Box = boxes.get(id) ?? {
      id,
      branch: node.branch,
      group,
      nodes: [],
      parents: new Map(),
      height: 0,
    };
    box.nodes.push(node);
    boxes.set(id, box);
  }
  for (const box of boxes.values()) {
    box.height = box.group
      ? GROUP_HEADER_HEIGHT + box.nodes.length * GROUP_ROW_HEIGHT
      : CARD_HEIGHT;
    for (const node of box.nodes) {
      for (const required of node.requires) {
        const parent = boxOf.get(required);
        if (!parent || parent === box.id) continue;
        const link = { source: required, target: node.id };
        box.parents.set(parent, [...(box.parents.get(parent) ?? []), link]);
      }
    }
  }
  return [...boxes.values()];
}

/** Column of a box = length of the longest dependency chain from a root. */
function computeColumns(boxes: readonly Box[]): Map<Placement['id'], number> {
  const byId = new Map(boxes.map((box) => [box.id, box]));
  const columns = new Map<Placement['id'], number>();
  const columnOf = (box: Box): number => {
    const known = columns.get(box.id);
    if (known !== undefined) return known;
    let column = 0;
    for (const parentId of box.parents.keys()) {
      const parent = byId.get(parentId);
      if (parent) column = Math.max(column, columnOf(parent) + 1);
    }
    columns.set(box.id, column);
    return column;
  };
  boxes.forEach(columnOf);
  return columns;
}

/**
 * Vertical places inside one band: each column is ordered by the average centre
 * of its parents (barycentre) so links cross less, then pushed down to avoid overlap.
 */
function placeBand(
  boxes: readonly Box[],
  columns: Map<Placement['id'], number>,
  centres: Map<Placement['id'], number>,
  top: number,
): Placement[] {
  const placements: Placement[] = [];
  const lastColumn = Math.max(...boxes.map((box) => columns.get(box.id) ?? 0));
  for (let column = 0; column <= lastColumn; column++) {
    const ordered = boxes
      .filter((box) => columns.get(box.id) === column)
      .map((box, order) => {
        const parentCentres = [...box.parents.keys()]
          .map((id) => centres.get(id))
          .filter((centre) => centre !== undefined);
        const wanted = parentCentres.length
          ? parentCentres.reduce((sum, centre) => sum + centre, 0) / parentCentres.length
          : top;
        return { box, wanted, order };
      })
      .sort((first, second) => first.wanted - second.wanted || first.order - second.order);
    let nextFree = top;
    for (const { box, wanted } of ordered) {
      const y = Math.max(nextFree, wanted - CARD_HEIGHT / 2);
      centres.set(box.id, y + CARD_HEIGHT / 2);
      const { id, branch, group, nodes, height } = box;
      placements.push({ id, branch, group, nodes, column, x: column * COLUMN_WIDTH, y, height });
      nextFree = y + height + ROW_GAP;
    }
  }
  return placements;
}

/** Links leave the parent's right side and enter at the child's first-card height. */
function edgePath(from: Placement, to: Placement): string {
  const startY = from.y + CARD_HEIGHT / 2;
  const endY = to.y + CARD_HEIGHT / 2;
  const bendX = to.x - COLUMN_GAP / 2;
  return `M ${from.x + CARD_WIDTH} ${startY} H ${bendX} V ${endY} H ${to.x}`;
}

export function layoutTree(
  nodes: readonly TreeNodeDef[],
  groups: readonly TreeGroupDef[],
  branchOrder: readonly BranchId[],
): TreeLayout {
  const boxes = buildBoxes(nodes, groups);
  const columns = computeColumns(boxes);
  const centres = new Map<Placement['id'], number>();
  const placements: Placement[] = [];
  const bands: Band[] = [];
  let top = 0;
  for (const branch of branchOrder) {
    const inBranch = boxes.filter((box) => box.branch === branch);
    if (inBranch.length === 0) continue;
    const placed = placeBand(inBranch, columns, centres, top);
    const bottom = Math.max(...placed.map((placement) => placement.y + placement.height));
    const left = Math.min(...placed.map((placement) => placement.x));
    bands.push({ branch, top, height: bottom - top, left });
    placements.push(...placed);
    top = bottom + BAND_GAP;
  }
  const byId = new Map(placements.map((placement) => [placement.id, placement]));
  const edges: Edge[] = boxes.flatMap((box) => {
    const child = byId.get(box.id);
    if (!child) return [];
    return [...box.parents].flatMap(([parentId, links]) => {
      const parent = byId.get(parentId);
      return parent ? [{ from: parentId, to: box.id, links, path: edgePath(parent, child) }] : [];
    });
  });
  const columnCount = Math.max(0, ...placements.map((placement) => placement.column)) + 1;
  return {
    placements,
    edges,
    bands,
    columns: columnCount,
    width: columnCount * COLUMN_WIDTH - COLUMN_GAP,
    height: Math.max(0, top - BAND_GAP),
  };
}
