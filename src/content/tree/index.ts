import type { TreeGroupDef, TreeNodeDef } from '../types';
import { basisGroups, basisNodes } from './basis';
import { futureNodes } from './future';

export const treeNodes: readonly TreeNodeDef[] = [...basisNodes, ...futureNodes];
export const treeGroups: readonly TreeGroupDef[] = [...basisGroups];
