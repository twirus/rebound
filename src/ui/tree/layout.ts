import type { BranchId, NodeId, TreeNodeDef } from '../../content/types';

export const CARD_WIDTH = 232;
export const CARD_HEIGHT = 92;
export const COLUMN_GAP = 64;
export const ROW_GAP = 16;
/** Vertical gap between branch bands. */
export const BAND_GAP = 40;

export interface Placement {
  node: TreeNodeDef;
  column: number;
  row: number;
  x: number;
  y: number;
}

export interface Edge {
  from: NodeId;
  to: NodeId;
  path: string;
}

export interface TreeLayout {
  placements: Placement[];
  edges: Edge[];
  columns: number;
  width: number;
  height: number;
}

/** Step of a node = length of the longest dependency chain from a root. */
function computeSteps(nodes: readonly TreeNodeDef[]): Map<NodeId, number> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const steps = new Map<NodeId, number>();
  const stepOf = (node: TreeNodeDef): number => {
    const known = steps.get(node.id);
    if (known !== undefined) return known;
    let step = 0;
    for (const id of node.requires) {
      const parent = byId.get(id);
      if (parent) step = Math.max(step, stepOf(parent) + 1);
    }
    steps.set(node.id, step);
    return step;
  };
  nodes.forEach(stepOf);
  return steps;
}

/**
 * Rows inside one branch band: each column is ordered by the average row of
 * its parents (barycentre) so links cross less, then pushed down to avoid overlap.
 */
function assignRows(
  nodes: readonly TreeNodeDef[],
  steps: Map<NodeId, number>,
): Map<NodeId, number> {
  const rows = new Map<NodeId, number>();
  const columnCount = Math.max(0, ...nodes.map((node) => steps.get(node.id) ?? 0)) + 1;
  for (let column = 0; column < columnCount; column++) {
    const inColumn = nodes
      .filter((node) => steps.get(node.id) === column)
      .map((node, order) => {
        const parentRows = node.requires
          .map((id) => rows.get(id))
          .filter((row) => row !== undefined);
        const barycentre = parentRows.length
          ? parentRows.reduce((sum, row) => sum + row, 0) / parentRows.length
          : order;
        return { node, barycentre, order };
      })
      .sort((first, second) => first.barycentre - second.barycentre || first.order - second.order);
    let nextFree = 0;
    for (const entry of inColumn) {
      const row = Math.max(nextFree, Math.round(entry.barycentre));
      rows.set(entry.node.id, row);
      nextFree = row + 1;
    }
  }
  return rows;
}

function edgePath(from: Placement, to: Placement): string {
  const startX = from.x + CARD_WIDTH;
  const startY = from.y + CARD_HEIGHT / 2;
  const endY = to.y + CARD_HEIGHT / 2;
  const bendX = to.x - COLUMN_GAP / 2;
  return `M ${startX} ${startY} H ${bendX} V ${endY} H ${to.x}`;
}

export function layoutTree(
  nodes: readonly TreeNodeDef[],
  branchOrder: readonly BranchId[],
): TreeLayout {
  const steps = computeSteps(nodes);
  const placements: Placement[] = [];
  let bandTop = 0;
  for (const branch of branchOrder) {
    const inBranch = nodes.filter((node) => node.branch === branch);
    if (inBranch.length === 0) continue;
    const rows = assignRows(inBranch, steps);
    let lastRow = 0;
    for (const node of inBranch) {
      const column = steps.get(node.id) ?? 0;
      const row = rows.get(node.id) ?? 0;
      lastRow = Math.max(lastRow, row);
      placements.push({
        node,
        column,
        row,
        x: column * (CARD_WIDTH + COLUMN_GAP),
        y: bandTop + row * (CARD_HEIGHT + ROW_GAP),
      });
    }
    bandTop += (lastRow + 1) * (CARD_HEIGHT + ROW_GAP) - ROW_GAP + BAND_GAP;
  }
  const byId = new Map(placements.map((placement) => [placement.node.id, placement]));
  const edges: Edge[] = placements.flatMap((placement) =>
    placement.node.requires.flatMap((id) => {
      const parent = byId.get(id);
      return parent ? [{ from: id, to: placement.node.id, path: edgePath(parent, placement) }] : [];
    }),
  );
  const columns = Math.max(0, ...placements.map((placement) => placement.column)) + 1;
  return {
    placements,
    edges,
    columns,
    width: columns * (CARD_WIDTH + COLUMN_GAP) - COLUMN_GAP,
    height: Math.max(0, bandTop - BAND_GAP),
  };
}
