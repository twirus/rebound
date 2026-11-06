/**
 * Headless pacing check: a bot buys the cheapest available node as soon as it
 * can afford it and taps whenever the push is ready. Prints when each purchase
 * happened. Run with `npm run pace`.
 */
import { it } from 'vitest';
import { treeNodes } from '../src/content/tree';
import { Game } from '../src/game/game';
import { canAfford, nextPrices, nodeStatus } from '../src/game/purchases';
import { newGameState } from '../src/game/state';
import { TICK_SECONDS } from '../src/sim/constants';

const MINUTES = Number(import.meta.env.PACE_MINUTES ?? 20);
const TAPS = import.meta.env.PACE_TAPS !== '0';
const TICKS_PER_SECOND = Math.round(1 / TICK_SECONDS);
const TAP_POINT = { x: 0, y: 120 };

function cheapestAffordable(game: Game): (typeof treeNodes)[number] | undefined {
  const levels = game.state.nodeLevels;
  return treeNodes
    .filter((node) => nodeStatus(node, levels, game.currentStats) === 'available')
    .filter((node) => canAfford(game.state.resources, nextPrices(node, levels)))
    .sort(
      (a, b) => (nextPrices(a, levels)[0]?.amount ?? 0) - (nextPrices(b, levels)[0]?.amount ?? 0),
    )[0];
}

function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

it('prints the purchase timeline', () => {
  const game = new Game(newGameState(), 7);
  const lines: string[] = [];
  let lastPurchase = 0;
  let longestWait = 0;
  for (let second = 1; second <= MINUTES * 60; second++) {
    for (let tick = 0; tick < TICKS_PER_SECOND; tick++) {
      game.step();
      if (TAPS) game.tap(TAP_POINT.x, TAP_POINT.y);
    }
    let node = cheapestAffordable(game);
    while (node) {
      const level = (game.state.nodeLevels[node.id] ?? 0) + 1;
      game.buy(node.id);
      longestWait = Math.max(longestWait, second - lastPurchase);
      lines.push(`${clock(second)}  +${second - lastPurchase}s  ${node.id} → ${level}`);
      lastPurchase = second;
      node = cheapestAffordable(game);
    }
  }
  const bought = treeNodes.reduce((sum, node) => sum + (game.state.nodeLevels[node.id] ?? 0), 0);
  const total = treeNodes.reduce((sum, node) => sum + node.maxLevel, 0);
  lines.push(
    `--- ${MINUTES} min, taps ${TAPS ? 'on' : 'off'}: ${bought}/${total} levels, longest wait ${longestWait}s`,
  );
  lines.push(`income/s at end: ${(game.income.perSecond()['resource:impulse'] ?? 0).toFixed(1)}`);
  console.log(lines.join('\n'));
}, 600_000);
