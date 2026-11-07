import { describe, expect, it } from 'vitest';
import { hotBonus, TickEarnings } from '../../src/game/earnings';
import { LawEconomy } from '../../src/game/lawEconomy';
import { emptyResources } from '../../src/game/state';
import { computeStats } from '../../src/game/stats';
import { newBall } from '../../src/sim/ball';
import { worldWithBalls } from '../sim/helpers';

const IMPULSE = 'resource:impulse';

function amounts(impulse: number) {
  const table = emptyResources();
  table[IMPULSE] = impulse;
  return table;
}

describe('law economy', () => {
  it('egoist pays ×10 with exactly one ball, nothing extra with two', () => {
    const economy = new LawEconomy();
    const one = worldWithBalls(1, 1);
    const single = amounts(5);
    economy.apply('law:egoist', single, one.world, one.arena);
    expect(single[IMPULSE]).toBe(50);
    const two = worldWithBalls(1, 2);
    const pair = amounts(5);
    economy.apply('law:egoist', pair, two.world, two.arena);
    expect(pair[IMPULSE]).toBe(5);
  });

  it('debt banks earnings and pays them ×2.5 on a collision', () => {
    const economy = new LawEconomy();
    const { world, arena } = worldWithBalls(1, 2);
    const first = amounts(10);
    world.events.clear();
    economy.apply('law:debt', first, world, arena);
    expect(first[IMPULSE]).toBe(0);
    world.events.push('ball-collision', 0, 0, 0, 100);
    const payday = amounts(0);
    economy.apply('law:debt', payday, world, arena);
    expect(payday[IMPULSE]).toBe(25);
  });

  it('debt is lost after 15 s without a collision', () => {
    const economy = new LawEconomy();
    const { world, arena } = worldWithBalls(1, 2);
    world.events.clear();
    economy.apply('law:debt', amounts(10), world, arena);
    for (let tick = 0; tick < 120 * 15; tick++) economy.apply('law:debt', amounts(0), world, arena);
    world.events.push('ball-collision', 0, 0, 0, 100);
    const payday = amounts(0);
    economy.apply('law:debt', payday, world, arena);
    expect(payday[IMPULSE]).toBe(0);
  });

  it('entropy grows income while untouched and pays the bank ×5 when it collapses', () => {
    const economy = new LawEconomy();
    const { world, arena } = worldWithBalls(1, 3);
    let total = 0;
    let peak = 0;
    for (let tick = 0; tick < 120 * 180 + 1; tick++) {
      const tickAmounts = amounts(1);
      economy.apply('law:entropy', tickAmounts, world, arena);
      total += tickAmounts[IMPULSE] ?? 0;
      peak = Math.max(peak, tickAmounts[IMPULSE] ?? 0);
    }
    expect(peak).toBeGreaterThan(1000);
    expect(arena.entropy).toBe(0);
    expect(total).toBeGreaterThan(120 * 180 * 2);
  });

  it('a tap resets entropy', () => {
    const economy = new LawEconomy();
    const { world, arena } = worldWithBalls(1, 1);
    for (let tick = 0; tick < 1200; tick++) economy.apply('law:entropy', amounts(1), world, arena);
    expect(arena.entropy).toBeGreaterThan(0);
    economy.touch();
    economy.apply('law:entropy', amounts(1), world, arena);
    expect(arena.entropy).toBeLessThan(0.001);
  });

  it('thermodynamics pays double for red-hot balls', () => {
    const { world } = worldWithBalls(1, 0);
    const earnings = new TickEarnings();
    const ball = newBall(1, 'ball:basic', 1);
    ball.heat = 8;
    world.events.clear();
    world.events.push('wall-hit', 0, 0, 0, 100, ball);
    earnings.collect(world.events, computeStats({}), [], hotBonus('law:thermo'));
    expect(earnings.amounts[IMPULSE]).toBe(2);
  });
});
