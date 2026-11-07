import type { TreeGroupDef, TreeNodeDef } from '../types';
import { basisGroups, basisNodes } from './basis';
import { futureNodes } from './future';
import { geometryGroups, geometryNodes } from './geometry';
import { matterGroups, matterNodes } from './matter';
import { polygonGroups, polygonNodes } from './polygons';
import { roundShapeGroups, roundShapeNodes } from './roundShapes';

export const treeNodes: readonly TreeNodeDef[] = [
  ...basisNodes,
  ...geometryNodes,
  ...polygonNodes,
  ...roundShapeNodes,
  ...matterNodes,
  ...futureNodes,
];
export const treeGroups: readonly TreeGroupDef[] = [
  ...basisGroups,
  ...geometryGroups,
  ...polygonGroups,
  ...roundShapeGroups,
  ...matterGroups,
];
