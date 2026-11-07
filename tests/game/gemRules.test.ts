import { describe, expect, it } from 'vitest';
import { treeNodes } from '../../src/content/tree';
import { Game } from '../../src/game/game';
import { loadUsed, placedGems, schemeSpecs, type GemSlotRef } from '../../src/game/gemRules';
import { deserializeState, serializeState } from '../../src/game/save';
import { newGameState } from '../../src/game/state';

/** A game where every gem and every gem slot upgrade is bought. */
function gemGame(): Game {
  const state = newGameState();
  for (const node of treeNodes) {
    const unlocksGem = node.unlocks?.some((id) => id.startsWith('gem:') || id.startsWith('law:'));
    const slotUpgrade = node.effects.some((effect) =>
      ['stat:scheme-slots', 'stat:support-slots', 'stat:law-slots'].includes(effect.stat),
    );
    if (unlocksGem || slotUpgrade) state.nodeLevels[node.id] = node.maxLevel;
  }
  return new Game(state, 3);
}

const event0: GemSlotRef = { part: 'event', scheme: 0 };
const effect0: GemSlotRef = { part: 'effect', scheme: 0 };
const event1: GemSlotRef = { part: 'event', scheme: 1 };

describe('gem placement', () => {
  it('builds a running scheme from an event and an effect', () => {
    const game = gemGame();
    expect(game.placeGem(event0, 'gem:on-wall-hit')).toBeNull();
    expect(game.placeGem(effect0, 'gem:blast')).toBeNull();
    expect(game.world.arenas[0]?.schemes).toHaveLength(1);
  });

  it('only takes gems of the right kind', () => {
    expect(gemGame().placeGem(event0, 'gem:blast')).toBe('wrong-kind');
  });

  it('keeps every gem in one place: placing it again moves it', () => {
    const game = gemGame();
    game.placeGem(event0, 'gem:on-wall-hit');
    game.placeGem(event1, 'gem:on-wall-hit');
    expect(game.state.arena.schemes[0]?.event).toBeNull();
    expect(game.state.arena.schemes[1]?.event).toBe('gem:on-wall-hit');
  });

  it('refuses a gem that would overload the arena', () => {
    const game = gemGame();
    const heavy = ['gem:repeat', 'gem:charge', 'gem:gravity-turn', 'gem:split'] as const;
    const problems = heavy.map((gem, scheme) => game.placeGem({ part: 'effect', scheme }, gem));
    expect(problems).toContain('overload');
    expect(loadUsed(game.state.arena, game.currentStats)).toBeLessThanOrEqual(
      game.currentStats['stat:gem-load'],
    );
  });

  it('has no scheme slots before the Mechanism branch', () => {
    const game = new Game(newGameState(), 3);
    expect(game.placeGem(event0, 'gem:on-wall-hit')).not.toBeNull();
  });

  it('survives a save and a reload', () => {
    const game = gemGame();
    game.placeGem(event0, 'gem:on-collide');
    game.placeGem(effect0, 'gem:freeze');
    const restored = deserializeState(serializeState(game.state));
    expect(schemeSpecs(restored.arena, game.currentStats)).toEqual([
      { event: 'gem:on-collide', effect: 'gem:freeze', supports: [] },
    ]);
    expect(placedGems(restored.arena, game.currentStats)).toHaveLength(2);
  });
});
