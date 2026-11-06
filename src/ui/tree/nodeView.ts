import type { TreeNodeDef } from '../../content/types';
import {
  canAfford,
  nextPrices,
  nodeStatus,
  type NodeStatus,
  type Price,
} from '../../game/purchases';
import { levelOf } from '../../game/state';
import { currentStats, nodeLevels, resourceAmounts } from '../../game/store';

export interface NodeView {
  node: TreeNodeDef;
  status: NodeStatus;
  level: number;
  prices: Price[];
  affordable: boolean;
}

/** Everything a card or the details panel needs; reads signals, so callers re-render on change. */
export function viewNode(node: TreeNodeDef): NodeView {
  const levels = nodeLevels.value;
  const status = nodeStatus(node, levels, currentStats.value);
  const prices = nextPrices(node, levels);
  return {
    node,
    status,
    level: levelOf(levels, node.id),
    prices,
    affordable: status === 'available' && canAfford(resourceAmounts.value, prices),
  };
}
