import { computed } from '@preact/signals';
import { treeNodes } from '../../content/tree';
import type { NodeId, TreeNodeDef } from '../../content/types';
import {
  canAfford,
  nextPrices,
  nodeStatus,
  type NodeStatus,
  type Price,
} from '../../game/purchases';
import { levelOf } from '../../game/state';
import { currentStats, nodeLevels, resourceAmounts } from '../../game/store';
import { t } from '../../i18n';
import { searchQuery } from '../uiState';

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

/** Name the player may see: silhouettes keep theirs secret. */
export function visibleName(view: NodeView): string {
  return view.status === 'hidden' ? t('tree.hiddenName') : t(view.node.nameKey);
}

/** Nodes matching the search box, or null when the search is empty. */
export const searchMatches = computed<ReadonlySet<NodeId> | null>(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  if (query === '') return null;
  return new Set(
    treeNodes
      .filter((node) => nodeStatus(node, nodeLevels.value, currentStats.value) !== 'hidden')
      .filter((node) => t(node.nameKey).toLocaleLowerCase().includes(query))
      .map((node) => node.id),
  );
});

export function isDimmedBySearch(id: NodeId): boolean {
  const matches = searchMatches.value;
  return matches !== null && !matches.has(id);
}
