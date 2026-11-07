import type { TreeGroupDef, TreeNodeDef } from '../types';

const IMPULSE = 'resource:impulse';
const SHARDS = 'resource:shards';
const BRANCH = 'branch:geometry';

export const geometryGroups: readonly TreeGroupDef[] = [
  { id: 'group:rings', branch: BRANCH, nameKey: 'group.rings.name' },
];

export const geometryNodes: readonly TreeNodeDef[] = [
  {
    id: 'node:rings',
    branch: BRANCH,
    kind: 'unlock',
    icon: 'reach',
    nameKey: 'node.rings.name',
    descriptionKey: 'node.rings.description',
    requires: ['node:hit-value'],
    unlocks: ['shape:rings'],
    maxLevel: 1,
    costs: [{ resource: IMPULSE, base: 2500, growth: 1 }],
    effects: [],
  },
  {
    id: 'node:ring-count',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:rings',
    icon: 'reach',
    nameKey: 'node.ring-count.name',
    descriptionKey: 'node.ring-count.description',
    requires: ['node:rings'],
    maxLevel: 8,
    costs: [{ resource: SHARDS, base: 25, growth: 1.95 }],
    effects: [{ stat: 'stat:ring-count', add: 1 }],
  },
  {
    id: 'node:ring-gap',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:rings',
    icon: 'arena',
    nameKey: 'node.ring-gap.name',
    descriptionKey: 'node.ring-gap.description',
    requires: ['node:rings'],
    maxLevel: 5,
    costs: [{ resource: SHARDS, base: 60, growth: 2.05 }],
    effects: [{ stat: 'stat:ring-gap', add: 5 }],
  },
  {
    id: 'node:ring-spin',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:rings',
    icon: 'cooldown',
    nameKey: 'node.ring-spin.name',
    descriptionKey: 'node.ring-spin.description',
    requires: ['node:rings'],
    maxLevel: 5,
    costs: [{ resource: SHARDS, base: 40, growth: 2.05 }],
    effects: [{ stat: 'stat:ring-spin', add: -0.1 }],
  },
  {
    id: 'node:shards-per-break',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:rings',
    icon: 'hit',
    nameKey: 'node.shards-per-break.name',
    descriptionKey: 'node.shards-per-break.description',
    requires: ['node:rings'],
    maxLevel: 5,
    costs: [
      { resource: SHARDS, base: 90, growth: 2.15 },
      { resource: IMPULSE, base: 3000, growth: 1.9 },
    ],
    effects: [{ stat: 'stat:shards-per-break', add: 1 }],
  },
  {
    id: 'node:shards-per-escape',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:rings',
    icon: 'link',
    nameKey: 'node.shards-per-escape.name',
    descriptionKey: 'node.shards-per-escape.description',
    requires: ['node:rings'],
    maxLevel: 4,
    costs: [{ resource: SHARDS, base: 120, growth: 2.3 }],
    effects: [{ stat: 'stat:shards-per-escape', add: 5 }],
  },
];
