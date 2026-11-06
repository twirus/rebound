import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, deserializeState, loadState, serializeState } from '../../src/game/save';
import { newGameState } from '../../src/game/state';

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

describe('save', () => {
  it('round-trips resources and node levels', () => {
    const state = newGameState();
    state.resources['resource:impulse'] = 1234.5;
    state.nodeLevels['node:extra-ball'] = 3;
    expect(deserializeState(serializeState(state))).toEqual(state);
  });

  it('writes the schema version', () => {
    expect(JSON.parse(serializeState(newGameState())).version).toBe(SAVE_VERSION);
  });

  it('drops unknown nodes and clamps levels to the maximum', () => {
    const raw = JSON.stringify({
      version: 1,
      resources: { 'resource:impulse': 5 },
      nodeLevels: { 'node:removed': 2, 'node:auto-tap': 99 },
    });
    expect(deserializeState(raw).nodeLevels).toEqual({ 'node:auto-tap': 1 });
  });

  it('rejects saves from a newer version', () => {
    expect(() => deserializeState(JSON.stringify({ version: SAVE_VERSION + 1 }))).toThrow();
  });

  it('keeps a broken save aside instead of losing it', () => {
    const storage = new MemoryStorage();
    storage.setItem('rebound.save', '{not json');
    const errors = console.error;
    console.error = () => undefined;
    expect(loadState(storage)).toBeNull();
    console.error = errors;
    expect(storage.getItem('rebound.save.broken')).toBe('{not json');
  });
});
