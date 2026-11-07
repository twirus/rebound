import { describe, expect, it } from 'vitest';
import { eventGems } from '../../src/content/gems/events';
import { effectGems } from '../../src/content/gems/effects';
import type { GemId, SimEventKind } from '../../src/content/types';
import { BallStatus } from '../../src/sim/ball';
import { EFFECTS, MAX_CHAIN_DEPTH, runSchemes, setArenaSchemes } from '../../src/sim/gems';
import type { ShapeContext } from '../../src/sim/shapes';
import type { Arena, Ball, World } from '../../src/sim/world';
import { worldWithBalls } from './helpers';

function setup(balls = 3): { world: World; arena: Arena; context: ShapeContext } {
  const { world, arena } = worldWithBalls(17, balls);
  arena.balls.forEach((ball, index) => {
    Object.assign(ball, { x: index * 30, y: 0, prevX: index * 30, prevY: 0, vx: 100, vy: 0 });
  });
  const context: ShapeContext = {
    world,
    arena,
    arenaIndex: 0,
    events: world.events,
    rng: world.rng,
  };
  return { world, arena, context };
}

/** Puts one event in the buffer and lets the arena's schemes react to it. */
function trigger(context: ShapeContext, kind: SimEventKind, ball: Ball | null): void {
  context.events.clear();
  context.events.push(kind, 0, ball?.x ?? 0, ball?.y ?? 0, 100, ball);
  runSchemes(context, 0);
}

function count(context: ShapeContext, kind: SimEventKind): number {
  let total = 0;
  for (let index = 0; index < context.events.count; index++) {
    if (context.events.at(index).kind === kind) total += 1;
  }
  return total;
}

describe('event gems', () => {
  it.each(eventGems.map((gem) => [gem.id, gem.listensTo ?? []] as const))(
    '%s fires its scheme',
    (id, listensTo) => {
      for (const kind of listensTo) {
        const { arena, context } = setup();
        setArenaSchemes(arena, [{ event: id, effect: 'gem:reverse', supports: [] }]);
        trigger(context, kind, arena.balls[0] ?? null);
        expect(arena.schemes[0]?.fired).toBe(1);
      }
    },
  );

  it('waits for the cooldown before firing again', () => {
    const { arena, context } = setup();
    setArenaSchemes(arena, [{ event: 'gem:on-wall-hit', effect: 'gem:reverse', supports: [] }]);
    trigger(context, 'wall-hit', arena.balls[0] ?? null);
    trigger(context, 'wall-hit', arena.balls[0] ?? null);
    expect(arena.schemes[0]?.fired).toBe(1);
  });
});

describe('effect gems', () => {
  it('has a behaviour for every effect gem', () => {
    expect(effectGems.filter((gem) => !EFFECTS[gem.id]).map((gem) => gem.id)).toEqual([]);
  });

  function fire(effect: GemId, balls = 3): { arena: Arena; context: ShapeContext; ball: Ball } {
    const { arena, context } = setup(balls);
    setArenaSchemes(arena, [{ event: 'gem:on-wall-hit', effect, supports: [] }]);
    const ball = arena.balls[0];
    if (!ball) throw new Error('No ball');
    trigger(context, 'wall-hit', ball);
    return { arena, context, ball };
  }

  it('split adds a short-lived copy', () => {
    const { arena } = fire('gem:split');
    expect(arena.balls.filter((ball) => ball.clone)).toHaveLength(1);
  });

  it('blast and repel push nearby balls away, attract pulls them in', () => {
    expect(fire('gem:blast').arena.balls[1]?.vx).toBeGreaterThan(100);
    expect(fire('gem:repel').arena.balls[1]?.vx).toBeGreaterThan(100);
    expect(fire('gem:attract').arena.balls[1]?.vx).toBeLessThan(100);
  });

  it('merge pulls the nearest ball into this one, which grows', () => {
    const { ball, context } = fire('gem:merge');
    expect(ball.radius).toBeGreaterThan(ball.baseRadius);
    expect(count(context, 'merge')).toBe(1);
  });

  it('teleport moves the ball, swap trades places with the farthest', () => {
    expect(fire('gem:teleport').ball.x).not.toBe(0);
    expect(fire('gem:swap').ball.x).toBe(60);
  });

  it('freeze stops the balls around, petrify turns the ball to stone', () => {
    expect(fire('gem:freeze').arena.balls[1]?.status).toBe(BallStatus.frozen);
    expect(fire('gem:petrify').ball.status).toBe(BallStatus.frozen);
  });

  it('heat warms, recolor recolours, reverse turns the ball round', () => {
    expect(fire('gem:heat').ball.heat).toBeGreaterThan(0);
    expect(fire('gem:recolor').ball.tint).toBe(0);
    expect(fire('gem:reverse').ball.vx).toBe(-100);
  });

  it('grow and shrink change the size', () => {
    const grown = fire('gem:grow').ball;
    expect(grown.radius).toBeGreaterThan(grown.baseRadius);
    const shrunk = fire('gem:shrink').ball;
    expect(shrunk.radius).toBeLessThan(shrunk.baseRadius);
  });

  it('charge goes off on the fifth firing', () => {
    const { arena, context } = setup();
    setArenaSchemes(arena, [{ event: 'gem:on-wall-hit', effect: 'gem:charge', supports: [] }]);
    const scheme = arena.schemes[0];
    let beams = 0;
    for (let firing = 0; firing < 5 && scheme; firing++) {
      scheme.cooldownLeft = 0;
      trigger(context, 'wall-hit', arena.balls[0] ?? null);
      beams += count(context, 'beam');
    }
    expect(beams).toBe(1);
  });

  it('gravity turn rotates gravity by a quarter', () => {
    const { arena } = fire('gem:gravity-turn');
    expect([arena.gravityX, arena.gravityY]).toEqual([-1, 0]);
  });

  it('repeat plays the previous event again', () => {
    const { arena, context } = setup();
    setArenaSchemes(arena, [{ event: 'gem:on-wall-hit', effect: 'gem:repeat', supports: [] }]);
    context.events.clear();
    context.events.push('ball-collision', 0, 0, 0, 50, null);
    context.events.push('wall-hit', 0, 0, 0, 50, arena.balls[0] ?? null);
    runSchemes(context, 0);
    expect(count(context, 'ball-collision')).toBe(2);
  });
});

describe('chains', () => {
  it(`stop at depth ${MAX_CHAIN_DEPTH}: deeper events fire nothing`, () => {
    for (const [depth, fired] of [
      [MAX_CHAIN_DEPTH - 1, 1],
      [MAX_CHAIN_DEPTH, 0],
    ] as const) {
      const { arena, context } = setup();
      setArenaSchemes(arena, [{ event: 'gem:on-recolor', effect: 'gem:recolor', supports: [] }]);
      context.events.clear();
      context.events.depth = depth;
      context.events.push('recolor', 0, 0, 0, 0, arena.balls[0] ?? null);
      runSchemes(context, 0);
      expect(arena.schemes[0]?.fired).toBe(fired);
    }
  });

  it('never lets a scheme react to what it caused itself', () => {
    const { arena, context } = setup();
    setArenaSchemes(arena, [{ event: 'gem:on-recolor', effect: 'gem:recolor', supports: [] }]);
    const scheme = arena.schemes[0];
    if (!scheme) throw new Error('No scheme');
    scheme.cooldownTicks = 0;
    trigger(context, 'recolor', arena.balls[0] ?? null);
    expect(scheme.fired).toBe(1);
  });

  it('lets schemes pass events along to each other, one link deeper each time', () => {
    const { arena, context } = setup();
    setArenaSchemes(arena, [
      { event: 'gem:on-wall-hit', effect: 'gem:recolor', supports: [] },
      { event: 'gem:on-recolor', effect: 'gem:grow', supports: [] },
    ]);
    trigger(context, 'wall-hit', arena.balls[0] ?? null);
    expect(arena.schemes.map((scheme) => scheme.fired)).toEqual([1, 1]);
  });
});
