import type { BallId, GemId, NodeId, ShapeId } from '../content/types';
import type { GemSlotRef, PlaceProblem } from './gemRules';
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

/** Arena panel: switch the main arena's shape. */
export function chooseShape(shapeId: ShapeId): void {
  if (!game.setShape(shapeId)) return;
  publishPurchases(game);
  saveNow();
}

/** Arena panel: switch the main arena's ball type. */
export function chooseBall(ballId: BallId): void {
  if (!game.setBall(ballId)) return;
  publishPurchases(game);
  saveNow();
}

/** Arena panel: returns why the gem did not fit, or null when it was placed. */
export function placeGemInSlot(slot: GemSlotRef, gemId: GemId): PlaceProblem | null {
  const problem = game.placeGem(slot, gemId);
  if (!problem) {
    publishPurchases(game);
    saveNow();
  }
  return problem;
}

export function clearGemSlot(slot: GemSlotRef): void {
  game.clearGemSlot(slot);
  publishPurchases(game);
  saveNow();
}

export function tapArena(x: number, y: number): boolean {
  const tapped = game.tap(x, y);
  if (tapped) publish(game);
  return tapped;
}
