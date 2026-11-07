import { describe, expect, it } from 'vitest';
import { RingShatter } from '../../src/render/ringShatter';
import { findShape, setArenaShape } from '../../src/sim/world';
import { worldWithBalls } from '../sim/helpers';

/** Records how many arcs and squares were drawn; everything else is a no-op. */
function recordingContext(): {
  context: CanvasRenderingContext2D;
  arcs: number[];
  squares: number;
} {
  const record = { arcs: [] as number[], squares: 0 };
  const fake = {
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    lineCap: 'butt',
    beginPath: () => undefined,
    stroke: () => undefined,
    arc: (_x: number, _y: number, radius: number) => record.arcs.push(radius),
    fillRect: () => (record.squares += 1),
  };
  return {
    context: fake as unknown as CanvasRenderingContext2D,
    get arcs() {
      return record.arcs;
    },
    get squares() {
      return record.squares;
    },
  };
}

describe('ring shatter effect', () => {
  it('breaks a ring into fading arcs and sparks, then clears', () => {
    const { world, arena } = worldWithBalls(1, 0);
    setArenaShape(world, arena, findShape('shape:rings'), 227);
    world.events.clear();
    world.events.push('ring-break', 0, 0, -100, 100);
    const shatter = new RingShatter();
    shatter.collect(world, 0, 1000);

    const during = recordingContext();
    shatter.draw(during.context, '#fff', 1, 1, 1200);
    expect(during.arcs.length).toBeGreaterThanOrEqual(6);
    expect(during.arcs.every((radius) => radius === 100)).toBe(true);
    expect(during.squares).toBe(5);

    const after = recordingContext();
    shatter.draw(after.context, '#fff', 1, 1, 2000);
    expect(after.arcs).toHaveLength(0);
  });
});
