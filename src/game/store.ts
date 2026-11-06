import { signal } from '@preact/signals';
import type { Game } from './game';
import { emptyResources, type NodeLevels, type ResourceTable } from './state';
import { computeStats, type Stats } from './stats';

/** Read-only snapshots for the UI, refreshed by `publish` a few times per second. */
export const resourceAmounts = signal<ResourceTable>(emptyResources());
export const incomePerSecond = signal<ResourceTable>(emptyResources());
export const nodeLevels = signal<NodeLevels>({});
export const currentStats = signal<Stats>(computeStats({}));
export const tapCooldownLeft = signal(0);

export function publish(game: Game): void {
  resourceAmounts.value = { ...game.state.resources };
  incomePerSecond.value = game.income.perSecond();
  tapCooldownLeft.value = game.tapCooldownLeft();
}

export function publishPurchases(game: Game): void {
  nodeLevels.value = { ...game.state.nodeLevels };
  currentStats.value = game.currentStats;
  publish(game);
}
