import { treeNodes } from '../content/tree';
import type { NodeId, ResourceId, TreeNodeDef } from '../content/types';
import { STAT_CAPS, nodePrice } from './balance';
import { levelOf, type GameState, type NodeLevels, type ResourceTable } from './state';
import type { Stats } from './stats';

/**
 * hidden — a requirement is itself still locked (shown as a silhouette);
 * locked — requirements not bought yet; capped — blocked by a limit stat;
 * available — can be bought when affordable; maxed — every level bought.
 */
export type NodeStatus = 'hidden' | 'locked' | 'capped' | 'available' | 'maxed';

export interface Price {
  resource: ResourceId;
  amount: number;
}

export function findNode(id: NodeId): TreeNodeDef {
  const node = treeNodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Unknown node ${id}`);
  return node;
}

export function isUnlocked(node: TreeNodeDef, levels: NodeLevels): boolean {
  return node.requires.every((id) => levelOf(levels, id) > 0);
}

function isCapped(node: TreeNodeDef, stats: Stats): boolean {
  return node.effects.some((effect) => {
    const cap = STAT_CAPS[effect.stat];
    return cap !== undefined && stats[effect.stat] + effect.add > stats[cap];
  });
}

export function nodeStatus(node: TreeNodeDef, levels: NodeLevels, stats: Stats): NodeStatus {
  if (levelOf(levels, node.id) >= node.maxLevel) return 'maxed';
  if (!isUnlocked(node, levels)) {
    const farAway = node.requires.some((id) => !isUnlocked(findNode(id), levels));
    return farAway ? 'hidden' : 'locked';
  }
  return isCapped(node, stats) ? 'capped' : 'available';
}

/** Price of the next level. */
export function nextPrices(node: TreeNodeDef, levels: NodeLevels): Price[] {
  const level = levelOf(levels, node.id);
  return node.costs.map((cost) => ({ resource: cost.resource, amount: nodePrice(cost, level) }));
}

export function canAfford(resources: ResourceTable, prices: readonly Price[]): boolean {
  return prices.every((price) => (resources[price.resource] ?? 0) >= price.amount);
}

/** Buys one level if possible. Mutates `state`; returns whether anything was bought. */
export function buyLevel(state: GameState, nodeId: NodeId, stats: Stats): boolean {
  const node = findNode(nodeId);
  if (nodeStatus(node, state.nodeLevels, stats) !== 'available') return false;
  const prices = nextPrices(node, state.nodeLevels);
  if (!canAfford(state.resources, prices)) return false;
  for (const price of prices) {
    state.resources[price.resource] = (state.resources[price.resource] ?? 0) - price.amount;
  }
  state.nodeLevels[nodeId] = levelOf(state.nodeLevels, nodeId) + 1;
  return true;
}
