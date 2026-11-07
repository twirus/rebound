import { balls } from '../content/balls';
import { resources } from '../content/resources';
import { shapes } from '../content/shapes';
import { treeNodes } from '../content/tree';
import { gems } from '../content/gems';
import type { GemId } from '../content/types';
import {
  emptySchemeSlot,
  newGameState,
  type ArenaSetup,
  type GameState,
  type SchemeSlot,
} from './state';

const SAVE_KEY = 'rebound.save';
/** A save that failed to load is kept here instead of being overwritten. */
const BROKEN_SAVE_KEY = 'rebound.save.broken';

export const SAVE_VERSION = 1;

/**
 * migrations[i] upgrades data of version i + 1 to version i + 2. Append one
 * whenever the format changes; never edit or remove old ones.
 */
const migrations: readonly ((data: Record<string, unknown>) => Record<string, unknown>)[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrate(data: Record<string, unknown>): Record<string, unknown> {
  let current = data;
  let version = typeof current.version === 'number' ? current.version : 0;
  if (version < 1 || version > SAVE_VERSION) throw new Error(`Unsupported save version ${version}`);
  while (version < SAVE_VERSION) {
    const step = migrations[version - 1];
    if (!step) throw new Error(`No migration from save version ${version}`);
    current = step(current);
    version += 1;
  }
  return current;
}

/** Unknown shape or ball ids (removed content) fall back to the defaults. */
function readGem(value: unknown): GemId | null {
  return gems.find((gem) => gem.id === value)?.id ?? null;
}

function readScheme(data: unknown): SchemeSlot {
  if (!isRecord(data)) return emptySchemeSlot();
  const supports = Array.isArray(data.supports) ? data.supports.map(readGem) : [];
  return { event: readGem(data.event), effect: readGem(data.effect), supports };
}

function readArena(data: unknown, fallback: ArenaSetup): ArenaSetup {
  if (!isRecord(data)) return fallback;
  const shape = shapes.find((candidate) => candidate.id === data.shape);
  const ball = balls.find((candidate) => candidate.id === data.ball);
  return {
    shape: shape?.id ?? fallback.shape,
    ball: ball?.id ?? fallback.ball,
    schemes: Array.isArray(data.schemes) ? data.schemes.map(readScheme) : [],
    law: readGem(data.law),
  };
}

/** Keeps known ids with sane values; unknown ids (removed content) are dropped. */
function readState(data: Record<string, unknown>): GameState {
  const state = newGameState();
  const savedResources = isRecord(data.resources) ? data.resources : {};
  const savedLevels = isRecord(data.nodeLevels) ? data.nodeLevels : {};
  for (const resource of resources) {
    const amount = savedResources[resource.id];
    if (typeof amount === 'number' && Number.isFinite(amount) && amount >= 0) {
      state.resources[resource.id] = amount;
    }
  }
  for (const node of treeNodes) {
    const level = savedLevels[node.id];
    if (typeof level === 'number' && Number.isInteger(level) && level > 0) {
      state.nodeLevels[node.id] = Math.min(level, node.maxLevel);
    }
  }
  state.arena = readArena(data.arena, state.arena);
  return state;
}

export function serializeState(state: GameState): string {
  return JSON.stringify({ version: SAVE_VERSION, ...state });
}

export function deserializeState(raw: string): GameState {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error('Save is not an object');
  return readState(migrate(parsed));
}

/** Returns null when there is no save. A broken save is set aside, never lost. */
export function loadState(storage: Storage): GameState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  try {
    return deserializeState(raw);
  } catch (error) {
    console.error('Save could not be loaded and was moved aside', error);
    storage.setItem(BROKEN_SAVE_KEY, raw);
    return null;
  }
}

export function saveState(storage: Storage, state: GameState): void {
  storage.setItem(SAVE_KEY, serializeState(state));
}
