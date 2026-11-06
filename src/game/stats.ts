import { treeNodes } from '../content/tree';
import type { StatId } from '../content/types';
import { BASE_STATS } from './balance';
import { levelOf, type NodeLevels } from './state';

export type Stats = Readonly<Record<StatId, number>>;

export function computeStats(levels: NodeLevels): Stats {
  const stats: Record<StatId, number> = { ...BASE_STATS };
  for (const node of treeNodes) {
    const level = levelOf(levels, node.id);
    if (level === 0) continue;
    for (const effect of node.effects) stats[effect.stat] += effect.add * level;
  }
  return stats;
}
