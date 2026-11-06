import { describe, expect, it } from 'vitest';
import { branches } from '../../src/content/branches';
import { treeNodes } from '../../src/content/tree';
import type { NodeId, TreeNodeDef } from '../../src/content/types';
import { CARD_HEIGHT, CARD_WIDTH, layoutTree } from '../../src/ui/tree/layout';

function node(id: NodeId, requires: NodeId[] = []): TreeNodeDef {
  return {
    id,
    branch: 'branch:basis',
    nameKey: '',
    descriptionKey: '',
    requires,
    maxLevel: 1,
    costs: [],
    effects: [],
  };
}

describe('tree layout', () => {
  it('puts each node in the column of its longest dependency chain', () => {
    const layout = layoutTree(
      [node('node:a'), node('node:b', ['node:a']), node('node:c', ['node:a', 'node:b'])],
      ['branch:basis'],
    );
    const columns = Object.fromEntries(layout.placements.map((p) => [p.node.id, p.column]));
    expect(columns).toEqual({ 'node:a': 0, 'node:b': 1, 'node:c': 2 });
  });

  it('never overlaps cards', () => {
    const layout = layoutTree(
      treeNodes,
      branches.map((branch) => branch.id),
    );
    const { placements } = layout;
    for (const first of placements) {
      for (const second of placements) {
        if (first === second) continue;
        const apart =
          first.x + CARD_WIDTH <= second.x ||
          second.x + CARD_WIDTH <= first.x ||
          first.y + CARD_HEIGHT <= second.y ||
          second.y + CARD_HEIGHT <= first.y;
        expect(apart).toBe(true);
      }
    }
  });

  it('draws one link per requirement', () => {
    const layout = layoutTree(
      treeNodes,
      branches.map((branch) => branch.id),
    );
    const links = treeNodes.reduce((sum, item) => sum + item.requires.length, 0);
    expect(layout.edges).toHaveLength(links);
  });
});
