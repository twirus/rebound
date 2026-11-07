import type { TreeGroupDef, TreeNodeDef } from '../types';

const IMPULSE = 'resource:impulse';
const SHARDS = 'resource:shards';
const SPECTRUM = 'resource:spectrum';
const BRANCH = 'branch:mechanism';

/** Mechanism: the first scheme, more schemes, support sockets and arena load. */
export const mechanismGroups: readonly TreeGroupDef[] = [
  { id: 'group:mechanism', branch: BRANCH, nameKey: 'group.mechanism.name' },
];

export const mechanismNodes: readonly TreeNodeDef[] = [
  {
    id: 'node:gem-slot',
    branch: BRANCH,
    kind: 'unlock',
    icon: 'gem',
    nameKey: 'node.gem-slot.name',
    descriptionKey: 'node.gem-slot.description',
    requires: ['node:hit-value'],
    unlocks: ['gem:on-wall-hit', 'gem:blast'],
    maxLevel: 1,
    costs: [{ resource: IMPULSE, base: 3000, growth: 1 }],
    effects: [{ stat: 'stat:scheme-slots', add: 1 }],
  },
  {
    id: 'node:scheme-slots',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:mechanism',
    icon: 'gem',
    nameKey: 'node.scheme-slots.name',
    descriptionKey: 'node.scheme-slots.description',
    requires: ['node:gem-slot'],
    maxLevel: 4,
    costs: [
      { resource: IMPULSE, base: 9000, growth: 3 },
      { resource: SHARDS, base: 200, growth: 2.4 },
    ],
    effects: [{ stat: 'stat:scheme-slots', add: 1 }],
  },
  {
    id: 'node:gem-load',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:mechanism',
    icon: 'limit',
    nameKey: 'node.gem-load.name',
    descriptionKey: 'node.gem-load.description',
    requires: ['node:gem-slot'],
    maxLevel: 10,
    costs: [{ resource: SHARDS, base: 120, growth: 1.7 }],
    effects: [{ stat: 'stat:gem-load', add: 5 }],
  },
  {
    id: 'node:support-slots',
    branch: BRANCH,
    kind: 'upgrade',
    group: 'group:mechanism',
    icon: 'link',
    nameKey: 'node.support-slots.name',
    descriptionKey: 'node.support-slots.description',
    requires: ['node:gem-slot'],
    maxLevel: 4,
    costs: [{ resource: SPECTRUM, base: 80, growth: 2.6 }],
    effects: [{ stat: 'stat:support-slots', add: 1 }],
  },
];
