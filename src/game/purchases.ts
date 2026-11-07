import { treeNodes } from '../content/tree';
import type { NodeCondition, NodeId, ResourceId, TreeNodeDef } from '../content/types';
import { STAT_CAPS, nodePrice } from './balance';
import { levelOf, type GameState, type NodeLevels, type ResourceTable } from './state';
import type { Stats } from './stats';

/**
 * hidden — far from reach or content of a later version (shown as a silhouette);
 * locked — requirements or conditions not met yet; capped — blocked by a limit stat;
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

function isBought(id: NodeId, levels: NodeLevels): boolean {
  return levelOf(levels, id) > 0;
}

export function requirementsMet(node: TreeNodeDef, levels: NodeLevels): boolean {
  if (node.requires.length === 0) return true;
  return node.requiresMode === 'any'
    ? node.requires.some((id) => isBought(id, levels))
    : node.requires.every((id) => isBought(id, levels));
}

/** No requirement can even be bought next: the node is too far to show. */
function isFarAway(node: TreeNodeDef, levels: NodeLevels): boolean {
  const reachable = (id: NodeId) => isBought(id, levels) || requirementsMet(findNode(id), levels);
  return node.requiresMode === 'any'
    ? !node.requires.some(reachable)
    : !node.requires.every(reachable);
}

export function totalLevels(levels: NodeLevels): number {
  return treeNodes.reduce((sum, node) => sum + levelOf(levels, node.id), 0);
}

export function conditionMet(condition: NodeCondition, levels: NodeLevels, stats: Stats): boolean {
  switch (condition.kind) {
    case 'stat-at-least':
      return stats[condition.stat] >= condition.value;
    case 'levels-bought':
      return totalLevels(levels) >= condition.value;
    case 'future':
      return false;
  }
}

export function isFuture(node: TreeNodeDef): boolean {
  return (node.conditions ?? []).some((condition) => condition.kind === 'future');
}

function isCapped(node: TreeNodeDef, stats: Stats): boolean {
  return node.effects.some((effect) => {
    const cap = STAT_CAPS[effect.stat];
    return cap !== undefined && stats[effect.stat] + effect.add > stats[cap];
  });
}

export function nodeStatus(node: TreeNodeDef, levels: NodeLevels, stats: Stats): NodeStatus {
  if (levelOf(levels, node.id) >= node.maxLevel) return 'maxed';
  if (isFuture(node)) return 'hidden';
  if (!requirementsMet(node, levels)) return isFarAway(node, levels) ? 'hidden' : 'locked';
  const conditions = node.conditions ?? [];
  if (!conditions.every((condition) => conditionMet(condition, levels, stats))) return 'locked';
  return isCapped(node, stats) ? 'capped' : 'available';
}

/** Price of the next level. */
export function nextPrices(node: TreeNodeDef, levels: NodeLevels): Price[] {
  const level = levelOf(levels, node.id);
  return node.costs.map((cost) => ({ resource: cost.resource, amount: nodePrice(cost, level) }));
}

export function hasEnough(resources: ResourceTable, price: Price): boolean {
  return (resources[price.resource] ?? 0) >= price.amount;
}

export function canAfford(resources: ResourceTable, prices: readonly Price[]): boolean {
  return prices.every((price) => hasEnough(resources, price));
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
