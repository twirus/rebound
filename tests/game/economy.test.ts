import { describe, expect, it } from 'vitest';
import type { ResourceId } from '../../src/content/types';
import { treeNodes } from '../../src/content/tree';
import { BASE_STATS, nodePrice } from '../../src/game/balance';
import { Game } from '../../src/game/game';
import { buyLevel, findNode, isFuture, nodeStatus } from '../../src/game/purchases';
import { newGameState, type GameState } from '../../src/game/state';
import { computeStats } from '../../src/game/stats';

function richState(): GameState {
  const state = newGameState();
  for (const id of Object.keys(state.resources) as ResourceId[]) state.resources[id] = 1e12;
  return state;
}

describe('prices', () => {
  it('grows as base × growth^level, rounded up', () => {
    const cost = { resource: 'resource:impulse' as const, base: 10, growth: 1.5 };
    expect(nodePrice(cost, 0)).toBe(10);
    expect(nodePrice(cost, 1)).toBe(15);
    expect(nodePrice(cost, 2)).toBe(23);
  });
});

describe('stats', () => {
  it('adds node effects per level on top of base stats', () => {
    const stats = computeStats({ 'node:extra-ball': 3 });
    expect(stats['stat:ball-count']).toBe(BASE_STATS['stat:ball-count'] + 3);
  });
});

describe('buying', () => {
  it('spends resources and raises the level', () => {
    const state = newGameState();
    state.resources['resource:impulse'] = 100;
    const bought = buyLevel(state, 'node:extra-ball', computeStats({}));
    expect(bought).toBe(true);
    expect(state.nodeLevels['node:extra-ball']).toBe(1);
    expect(state.resources['resource:impulse']).toBe(
      100 -
        nodePrice(
          findNode('node:extra-ball').costs[0] ?? {
            resource: 'resource:impulse',
            base: 0,
            growth: 1,
          },
          0,
        ),
    );
  });

  it('refuses when resources are short', () => {
    const state = newGameState();
    expect(buyLevel(state, 'node:extra-ball', computeStats({}))).toBe(false);
    expect(state.nodeLevels['node:extra-ball']).toBeUndefined();
  });

  it('refuses nodes whose requirements are not bought', () => {
    const state = richState();
    expect(buyLevel(state, 'node:hit-value', computeStats({}))).toBe(false);
  });

  it('stops extra balls at the ball limit', () => {
    const state = richState();
    let stats = computeStats({});
    while (buyLevel(state, 'node:extra-ball', stats)) stats = computeStats(state.nodeLevels);
    expect(stats['stat:ball-count']).toBe(stats['stat:ball-limit']);
    expect(nodeStatus(findNode('node:extra-ball'), state.nodeLevels, stats)).toBe('capped');
  });

  it('marks nodes two steps away as hidden and one step away as locked', () => {
    const stats = computeStats({});
    expect(nodeStatus(findNode('node:hit-value'), {}, stats)).toBe('locked');
    expect(nodeStatus(findNode('node:ball-speed'), {}, stats)).toBe('hidden');
  });

  it('opens an any-of node after one of its requirements', () => {
    const stats = computeStats({});
    const echo = findNode('node:tap-echo');
    expect(nodeStatus(echo, { 'node:tap-strength': 1 }, stats)).toBe('locked');
    expect(nodeStatus(echo, { 'node:tap-strength': 1, 'node:tap-reach': 1 }, stats)).toBe(
      'available',
    );
  });

  it('keeps a node locked until its extra condition is met', () => {
    const levels = { 'node:ball-limit': 1, 'node:auto-tap-interval': 1 };
    const amplifier = findNode('node:amplifier');
    expect(nodeStatus(amplifier, levels, computeStats(levels))).toBe('locked');
    const crowded = { ...levels, 'node:extra-ball': 14 };
    expect(nodeStatus(amplifier, crowded, computeStats(crowded))).toBe('available');
  });

  it('never sells content of a later version', () => {
    const state = richState();
    const triangle = findNode('node:triangle');
    for (const id of triangle.requires) state.nodeLevels[id] = 1;
    expect(nodeStatus(triangle, state.nodeLevels, computeStats(state.nodeLevels))).toBe('hidden');
    expect(buyLevel(state, triangle.id, computeStats(state.nodeLevels))).toBe(false);
  });

  it('can buy every node to its maximum with enough resources', () => {
    const game = new Game(richState(), 1);
    for (let round = 0; round < 50; round++) {
      for (const node of treeNodes) game.buy(node.id);
    }
    const capped = treeNodes.filter(
      (node) =>
        (game.state.nodeLevels[node.id] ?? 0) < node.maxLevel &&
        node.id !== 'node:extra-ball' &&
        !isFuture(node),
    );
    expect(capped.map((node) => node.id)).toEqual([]);
  });
});

describe('game', () => {
  it('earns impulse from wall hits', () => {
    const game = new Game(newGameState(), 4);
    for (let tick = 0; tick < 1_200; tick++) game.step();
    expect(game.state.resources['resource:impulse']).toBeGreaterThan(0);
    expect(game.income.perSecond()['resource:impulse']).toBeGreaterThan(0);
  });

  it('spawns a ball for each extra-ball level', () => {
    const game = new Game(richState(), 4);
    game.buy('node:extra-ball');
    game.buy('node:extra-ball');
    expect(game.world.arenas[0]?.balls.length).toBe(3);
  });

  it('puts the tap on cooldown', () => {
    const game = new Game(newGameState(), 4);
    expect(game.tap(0, 0)).toBe(true);
    expect(game.tap(0, 0)).toBe(false);
    for (let tick = 0; tick < 240; tick++) game.step();
    expect(game.tap(0, 0)).toBe(true);
  });

  it('auto-pushes from the bottom once bought', () => {
    const state = richState();
    state.nodeLevels['node:auto-tap'] = 1;
    const game = new Game(state, 4);
    let pushes = 0;
    for (let tick = 0; tick < 120 * 21; tick++) {
      game.step();
      for (let index = 0; index < game.world.events.count; index++) {
        if (game.world.events.at(index).kind === 'push') pushes += 1;
      }
    }
    expect(pushes).toBe(3);
  });

  it('switches to Rings only after they are bought', () => {
    const game = new Game(richState(), 4);
    expect(game.setShape('shape:rings')).toBe(false);
    game.state.nodeLevels['node:rings'] = 1;
    expect(game.setShape('shape:rings')).toBe(true);
    expect(game.world.arenas[0]?.shape.kind).toBe('rings');
  });

  it('earns Shards in the Rings arena', () => {
    const state = newGameState();
    state.nodeLevels['node:rings'] = 1;
    state.nodeLevels['node:ball-speed'] = 3;
    state.arena.shape = 'shape:rings';
    const game = new Game(state, 4);
    for (let tick = 0; tick < 120 * 30; tick++) game.step();
    expect(game.state.resources['resource:shards']).toBeGreaterThan(0);
  });

  it('repeats a tap as a weaker echo once the echo is bought', () => {
    const state = richState();
    state.nodeLevels['node:tap-echo'] = 1;
    const game = new Game(state, 4);
    game.tap(0, 0);
    const strengths: number[] = [];
    for (let tick = 0; tick < 60; tick++) {
      game.step();
      for (let index = 0; index < game.world.events.count; index++) {
        const event = game.world.events.at(index);
        if (event.kind === 'push') strengths.push(event.strength);
      }
    }
    expect(strengths).toHaveLength(2);
  });
});
