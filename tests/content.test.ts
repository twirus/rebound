import { describe, expect, it } from 'vitest';
import { balls } from '../src/content/balls';
import { branches } from '../src/content/branches';
import { gems } from '../src/content/gems';
import { resources } from '../src/content/resources';
import { shapes } from '../src/content/shapes';
import { stats } from '../src/content/stats';
import { treeGroups, treeNodes } from '../src/content/tree';
import type { NodeId, TreeNodeDef } from '../src/content/types';
import { BASE_STATS } from '../src/game/balance';
import en from '../src/i18n/en.json';
import ru from '../src/i18n/ru.json';

interface Identified {
  id: string;
}

const allEntries: readonly Identified[] = [
  ...resources,
  ...shapes,
  ...balls,
  ...gems,
  ...treeNodes,
  ...treeGroups,
  ...branches,
  ...stats,
];

const allTextKeys: readonly string[] = [
  ...resources.flatMap((resource) => [resource.nameKey, resource.perSecondKey]),
  ...shapes.flatMap((shape) => [shape.nameKey, shape.descriptionKey]),
  ...branches.map((branch) => branch.nameKey),
  ...stats.map((stat) => stat.nameKey),
  ...balls.flatMap((ball) => [ball.nameKey, ball.descriptionKey]),
  ...gems.flatMap((gem) => [gem.nameKey, gem.descriptionKey, gem.downsideKey]),
  ...treeNodes.flatMap((node) => [node.nameKey, node.descriptionKey]),
  ...treeGroups.map((group) => group.nameKey),
];

/** Returns ids that sit on a dependency cycle (depth-first search with colouring). */
function findCycleNodes(nodes: readonly TreeNodeDef[]): NodeId[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const state = new Map<NodeId, 'visiting' | 'done'>();
  const cyclic: NodeId[] = [];
  const visit = (id: NodeId): void => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      cyclic.push(id);
      return;
    }
    state.set(id, 'visiting');
    for (const dependency of byId.get(id)?.requires ?? []) visit(dependency);
    state.set(id, 'done');
  };
  for (const node of nodes) visit(node.id);
  return cyclic;
}

/** Nodes reachable from roots by buying dependencies first. */
function findReachable(nodes: readonly TreeNodeDef[]): Set<NodeId> {
  const reachable = new Set<NodeId>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of nodes) {
      if (!reachable.has(node.id) && node.requires.every((id) => reachable.has(id))) {
        reachable.add(node.id);
        grew = true;
      }
    }
  }
  return reachable;
}

describe('content', () => {
  it('has unique ids', () => {
    const ids = allEntries.map((entry) => entry.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('references only existing resources', () => {
    const resourceIds = resources.map((resource) => resource.id);
    expect(shapes.filter((shape) => !resourceIds.includes(shape.resource))).toEqual([]);
  });

  it('references only existing tree nodes', () => {
    const nodeIds = new Set(treeNodes.map((node) => node.id));
    const broken = treeNodes.flatMap((node) => node.requires.filter((id) => !nodeIds.has(id)));
    expect(broken).toEqual([]);
  });

  it('gives every node a known branch, levels and costs in known resources', () => {
    const branchIds = branches.map((branch) => branch.id);
    const resourceIds = resources.map((resource) => resource.id);
    const invalid = treeNodes.filter(
      (node) =>
        !branchIds.includes(node.branch) ||
        node.maxLevel < 1 ||
        node.costs.length === 0 ||
        node.costs.some(
          (cost) => !resourceIds.includes(cost.resource) || cost.base <= 0 || cost.growth < 1,
        ),
    );
    expect(invalid.map((node) => node.id)).toEqual([]);
  });

  it('describes every stat that has a base value', () => {
    const described: string[] = stats.map((stat) => stat.id);
    expect(Object.keys(BASE_STATS).filter((id) => !described.includes(id))).toEqual([]);
  });

  it('lists every upgrade in a group of its branch, and only upgrades', () => {
    const invalid = treeNodes.filter((node) => {
      const group = treeGroups.find((candidate) => candidate.id === node.group);
      return node.kind === 'upgrade' ? group?.branch !== node.branch : node.group !== undefined;
    });
    expect(invalid.map((node) => node.id)).toEqual([]);
  });

  it('has no empty groups', () => {
    const empty = treeGroups.filter((group) => !treeNodes.some((node) => node.group === group.id));
    expect(empty.map((group) => group.id)).toEqual([]);
  });

  it('has no cycles in the tree', () => {
    expect(findCycleNodes(treeNodes)).toEqual([]);
  });

  it('can reach every tree node', () => {
    const reachable = findReachable(treeNodes);
    expect(treeNodes.filter((node) => !reachable.has(node.id)).map((node) => node.id)).toEqual([]);
  });

  it('gives every gem tags, a load and a downside', () => {
    const invalid = gems.filter(
      (gem) => gem.tags.length === 0 || gem.load <= 0 || gem.downsideKey === '',
    );
    expect(invalid.map((gem) => gem.id)).toEqual([]);
  });

  it('has every text key in both languages', () => {
    const ruKeys: Record<string, string> = ru;
    const enKeys: Record<string, string> = en;
    expect(allTextKeys.filter((key) => !(key in ruKeys))).toEqual([]);
    expect(allTextKeys.filter((key) => !(key in enKeys))).toEqual([]);
  });

  it('keeps ru.json and en.json in sync', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ru).sort());
  });
});
