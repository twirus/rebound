import { describe, expect, it } from 'vitest';
import type { GemId, SimEventKind } from '../../src/content/types';
import { runSchemes, setArenaSchemes, type SchemeSpec } from '../../src/sim/gems';
import type { ShapeContext } from '../../src/sim/shapes';
import type { Arena, Ball } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

const HEAT_PER_FIRING = 3;

function setup(
  specs: SchemeSpec[],
  balls = 3,
): { arena: Arena; context: ShapeContext; ball: Ball } {
  const { world, arena } = worldWithBalls(23, balls);
  arena.balls.forEach((ball, index) => {
    Object.assign(ball, { x: index * 30, y: -20, prevX: index * 30, prevY: -20, vx: 0, vy: 0 });
  });
  setArenaSchemes(arena, specs);
  const context: ShapeContext = {
    world,
    arena,
    arenaIndex: 0,
    events: world.events,
    rng: world.rng,
  };
  const ball = arena.balls[0];
  if (!ball) throw new Error('No ball');
  return { arena, context, ball };
}

function heatScheme(supports: GemId[]): SchemeSpec {
  return { event: 'gem:on-wall-hit', effect: 'gem:heat', supports };
}

/** One event on the ball, then `ticks` quiet ticks for anything delayed. */
function trigger(
  context: ShapeContext,
  ball: Ball | null,
  ticks = 0,
  kind: SimEventKind = 'wall-hit',
): void {
  context.events.clear();
  context.events.push(kind, 0, ball?.x ?? 0, ball?.y ?? 0, 100, ball);
  runSchemes(context, 0);
  for (let tick = 0; tick < ticks; tick++) {
    context.world.tick += 1;
    context.events.clear();
    runSchemes(context, 0);
  }
}

describe('supports', () => {
  it('echo repeats the effect a second later at half strength', () => {
    const { context, ball } = setup([heatScheme(['gem:echo'])]);
    trigger(context, ball);
    expect(ball.heat).toBe(HEAT_PER_FIRING);
    trigger(context, null, 130);
    expect(ball.heat).toBe(HEAT_PER_FIRING * 1.5);
  });

  it('delay lands three times as strong, three seconds later', () => {
    const { context, ball } = setup([heatScheme(['gem:delay'])]);
    trigger(context, ball);
    expect(ball.heat).toBe(0);
    trigger(context, null, 370);
    expect(ball.heat).toBe(HEAT_PER_FIRING * 3);
  });

  it('chain jumps on to the nearest other balls', () => {
    const { arena, context, ball } = setup([heatScheme(['gem:chain'])], 4);
    trigger(context, ball, 200);
    expect(arena.balls.filter((other) => other.heat > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('area hits every ball nearby at 40%', () => {
    const { arena, context, ball } = setup([heatScheme(['gem:area'])]);
    trigger(context, ball);
    expect(arena.balls.every((other) => other.heat === HEAT_PER_FIRING * 0.4)).toBe(true);
  });

  it('fragile doubles the effect and breaks a ball after 20 firings', () => {
    const { arena, context, ball } = setup([heatScheme(['gem:fragile'])]);
    let vanished = 0;
    for (let firing = 0; firing < 20; firing++) {
      const scheme = arena.schemes[0];
      if (scheme) scheme.cooldownLeft = 0;
      trigger(context, ball);
      for (let index = 0; index < context.events.count; index++) {
        if (context.events.at(index).kind === 'vanish') vanished += 1;
      }
    }
    expect(vanished).toBe(1);
  });

  it('greed doubles its rewards and slows the other schemes', () => {
    const { arena } = setup([heatScheme(['gem:greed']), heatScheme([])]);
    const [greedy, other] = arena.schemes;
    expect(greedy?.rewardScale).toBe(2);
    expect(other?.cooldownTicks).toBeGreaterThan(greedy?.cooldownTicks ?? 0);
  });

  it('focus always lands on the largest ball, five times as strong', () => {
    const { arena, context, ball } = setup([heatScheme(['gem:focus'])]);
    const largest = arena.balls[2];
    if (!largest) throw new Error('No ball');
    largest.radius *= 2;
    trigger(context, ball);
    expect(largest.heat).toBe(HEAT_PER_FIRING * 5);
    expect(ball.heat).toBe(0);
  });

  it('chance borrows the effect of another scheme', () => {
    const { context, ball } = setup([
      { event: 'gem:on-wall-hit', effect: 'gem:heat', supports: ['gem:chance'] },
      { event: 'gem:on-quiet', effect: 'gem:reverse', supports: [] },
    ]);
    ball.vx = 50;
    trigger(context, ball);
    expect(ball.vx).toBe(-50);
    expect(ball.heat).toBe(0);
  });

  it('overheat grows stronger with each firing, then pauses', () => {
    const { arena, context, ball } = setup([heatScheme(['gem:overheat'])]);
    const scheme = arena.schemes[0];
    if (!scheme) throw new Error('No scheme');
    for (let firing = 0; firing < 10; firing++) {
      scheme.cooldownLeft = 0;
      trigger(context, ball);
    }
    expect(ball.heat).toBeGreaterThan(HEAT_PER_FIRING * 10);
    expect(scheme.cooldownLeft).toBe(1200);
  });

  it('quick halves the recharge and weakens the effect; mirror copies it at 60%', () => {
    const plain = setup([heatScheme([])]).arena.schemes[0];
    const quick = setup([heatScheme(['gem:quick'])]).arena.schemes[0];
    const mirrored = setup([heatScheme(['gem:quick', 'gem:mirror'])]).arena.schemes[0];
    expect(quick?.cooldownTicks).toBe(Math.round((plain?.cooldownTicks ?? 0) / 2));
    expect(quick?.power).toBeCloseTo(0.6);
    expect(mirrored?.cooldownTicks).toBeLessThan(quick?.cooldownTicks ?? 0);
  });

  it('sturdy still fires deep in a chain', () => {
    const { arena, context, ball } = setup([heatScheme(['gem:sturdy'])]);
    context.events.clear();
    context.events.depth = 10;
    context.events.push('wall-hit', 0, 0, 0, 0, ball);
    runSchemes(context, 0);
    expect(arena.schemes[0]?.fired).toBe(1);
  });
});

describe('conditions', () => {
  it('only-color fires on red balls only, twice as strong', () => {
    const { context, ball } = setup([heatScheme(['gem:only-color'])]);
    trigger(context, ball);
    expect(ball.heat).toBe(0);
    ball.tint = 0;
    trigger(context, ball);
    expect(ball.heat).toBe(HEAT_PER_FIRING * 2);
  });

  it('only-half fires in the top half only', () => {
    const { context, ball } = setup([heatScheme(['gem:only-half'])]);
    ball.y = 50;
    trigger(context, ball);
    expect(ball.heat).toBe(0);
  });

  it('only-big and only-small compare with the average size', () => {
    const big = setup([heatScheme(['gem:only-big'])]);
    big.ball.radius *= 2;
    trigger(big.context, big.ball);
    expect(big.ball.heat).toBe(HEAT_PER_FIRING * 2);
    const small = setup([heatScheme(['gem:only-small'])]);
    trigger(small.context, small.ball);
    expect(small.ball.heat).toBe(0);
  });

  it('only-hot needs a red-hot ball', () => {
    const { context, ball } = setup([heatScheme(['gem:only-hot'])]);
    trigger(context, ball);
    expect(ball.heat).toBe(0);
    ball.heat = 8;
    trigger(context, ball);
    expect(ball.heat).toBe(8 + HEAT_PER_FIRING * 2.5);
  });

  it('rare waits at least a second; every-nth fires on the tenth trigger', () => {
    expect(
      setup([heatScheme(['gem:rare'])]).arena.schemes[0]?.cooldownTicks,
    ).toBeGreaterThanOrEqual(120);
    const { arena, context, ball } = setup([heatScheme(['gem:every-nth'])]);
    for (let trigger_ = 0; trigger_ < 10; trigger_++) trigger(context, ball, 30);
    expect(arena.schemes[0]?.fired).toBe(1);
    expect(ball.heat).toBe(HEAT_PER_FIRING * 12);
  });
});
