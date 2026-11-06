import type { NodeId } from '../content/types';
import { AUTOSAVE_SECONDS } from './balance';
import { Game } from './game';
import { loadState, saveState } from './save';
import { newGameState } from './state';
import { publish, publishPurchases } from './store';

const SEED_RANGE = 2 ** 32;
/** UI snapshots are refreshed every this many ticks (~10 times per second). */
const PUBLISH_EVERY_TICKS = 12;

function openStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.error('localStorage is unavailable; progress will not be saved', error);
    return null;
  }
}

const storage = openStorage();

/** The seed is chosen outside sim/; the simulation itself never touches Math.random. */
export const game = new Game(
  (storage && loadState(storage)) ?? newGameState(),
  Math.floor(Math.random() * SEED_RANGE),
);
publishPurchases(game);

export function saveNow(): void {
  if (storage) saveState(storage, game.state);
}

export function stepGame(): void {
  game.step();
  if (game.world.tick % PUBLISH_EVERY_TICKS === 0) publish(game);
}

/** Saves periodically and whenever the tab is hidden. Returns a stop function. */
export function startAutosave(): () => void {
  const timer = window.setInterval(saveNow, AUTOSAVE_SECONDS * 1000);
  const onHide = () => {
    if (document.hidden) saveNow();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', saveNow);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', saveNow);
  };
}

/** UI actions: the only way the interface changes the game. */
export function buyNode(nodeId: NodeId): boolean {
  const bought = game.buy(nodeId);
  if (bought) {
    publishPurchases(game);
    saveNow();
  }
  return bought;
}

export function tapArena(x: number, y: number): boolean {
  const tapped = game.tap(x, y);
  if (tapped) publish(game);
  return tapped;
}
