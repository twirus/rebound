import { describe, expect, it } from 'vitest';
import { branches } from '../../src/content/branches';
import { treeGroups, treeNodes } from '../../src/content/tree';
import type { GroupId, NodeId, TreeGroupDef, TreeNodeDef } from '../../src/content/types';
import { CARD_WIDTH, layoutTree, type Placement } from '../../src/ui/tree/layout';

function node(id: NodeId, requires: NodeId[] = [], group?: GroupId): TreeNodeDef {
  return {
    id,
    branch: 'branch:basis',
    kind: group ? 'upgrade' : 'unlock',
    ...(group ? { group } : {}),
    icon: 'ball',
    nameKey: '',
    descriptionKey: '',
    requires,
    maxLevel: 1,
    costs: [],
    effects: [],
  };
}

const testGroup: TreeGroupDef = { id: 'group:test', branch: 'branch:basis', nameKey: '' };
const fullLayout = layoutTree(
  treeNodes,
  treeGroups,
  branches.map((branch) => branch.id),
);

function overlaps(first: Placement, second: Placement): boolean {
  return !(
    first.x + CARD_WIDTH <= second.x ||
    second.x + CARD_WIDTH <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

describe('tree layout', () => {
  it('puts each node in the column of its longest dependency chain', () => {
    const layout = layoutTree(
      [node('node:a'), node('node:b', ['node:a']), node('node:c', ['node:a', 'node:b'])],
      [],
      ['branch:basis'],
    );
    const columns = Object.fromEntries(layout.placements.map((p) => [p.id, p.column]));
    expect(columns).toEqual({ 'node:a': 0, 'node:b': 1, 'node:c': 2 });
  });

  it('puts upgrades of one group into a single box with one incoming link', () => {
    const layout = layoutTree(
      [
        node('node:a'),
        node('node:b', ['node:a'], 'group:test'),
        node('node:c', ['node:b'], 'group:test'),
      ],
      [testGroup],
      ['branch:basis'],
    );
    const group = layout.placements.find((placement) => placement.id === 'group:test');
    expect(group?.nodes.map((member) => member.id)).toEqual(['node:b', 'node:c']);
    expect(group?.column).toBe(1);
    expect(layout.edges.map((edge) => [edge.from, edge.to])).toEqual([['node:a', 'group:test']]);
  });

  it('never overlaps boxes', () => {
    const { placements } = fullLayout;
    const clashes = placements.flatMap((first, index) =>
      placements
        .slice(index + 1)
        .filter((second) => overlaps(first, second))
        .map((second) => `${first.id} × ${second.id}`),
    );
    expect(clashes).toEqual([]);
  });

  it('places every node and gives each branch with nodes its own band', () => {
    const placed = fullLayout.placements.flatMap((placement) => placement.nodes);
    expect(placed).toHaveLength(treeNodes.length);
    const branchesWithNodes = new Set(treeNodes.map((item) => item.branch));
    expect(fullLayout.bands.map((band) => band.branch).sort()).toEqual(
      [...branchesWithNodes].sort(),
    );
  });
});
