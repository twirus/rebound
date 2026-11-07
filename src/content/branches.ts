import type { BranchDef } from './types';

/** Order here is the order of bands in the tree and rows in the branch panel. */
export const branches: readonly BranchDef[] = [
  { id: 'branch:basis', nameKey: 'branch.basis.name', color: '#b0a58c' },
  { id: 'branch:geometry', nameKey: 'branch.geometry.name', color: '#7fb2c9' },
  { id: 'branch:matter', nameKey: 'branch.matter.name', color: '#c98f6a' },
  { id: 'branch:mechanism', nameKey: 'branch.mechanism.name', color: '#b59ad1' },
  { id: 'branch:links', nameKey: 'branch.links.name', color: '#8fa7c9' },
  { id: 'branch:time', nameKey: 'branch.time.name', color: '#d4c36a' },
  { id: 'branch:harmony', nameKey: 'branch.harmony.name', color: '#7fc9a3' },
  { id: 'branch:singularity', nameKey: 'branch.singularity.name', color: '#c96a7f' },
];
