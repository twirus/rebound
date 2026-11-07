import type { TreeGroupDef, TreeNodeDef } from '../types';
import { basisGroups, basisNodes } from './basis';
import { futureNodes } from './future';
import { geometryGroups, geometryNodes } from './geometry';

export const treeNodes: readonly TreeNodeDef[] = [...basisNodes, ...geometryNodes, ...futureNodes];
export const treeGroups: readonly TreeGroupDef[] = [...basisGroups, ...geometryGroups];
