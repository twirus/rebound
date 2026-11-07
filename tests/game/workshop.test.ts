import { describe, expect, it } from 'vitest';
import { DEFAULT_WORKSHOP, Workshop } from '../../src/game/workshop';

describe('workshop', () => {
  it('builds the arena from the settings', () => {
    const workshop = new Workshop({
      ...DEFAULT_WORKSHOP,
      shape: 'shape:hexagon',
      ball: 'ball:heavy',
      ballCount: 12,
      gravity: 0.5,
      bounce: 450,
    });
    const arena = workshop.world.arenas[0];
    expect(arena?.shape.kind).toBe('hexagon');
    expect(arena?.balls).toHaveLength(12);
    expect(arena?.balls.every((ball) => ball.typeId === 'ball:heavy')).toBe(true);
    expect(arena?.gravity).toBe(0.5);
    expect(arena?.minBounceSpeed).toBe(450);
  });

  it('keeps to the shape limit and replays the same way every time', () => {
    const settings = { ...DEFAULT_WORKSHOP, shape: 'shape:rings' as const, ballCount: 30 };
    const first = new Workshop(settings);
    const second = new Workshop(settings);
    expect(first.world.arenas[0]?.balls).toHaveLength(1);
    for (let tick = 0; tick < 600; tick++) {
      first.step();
      second.step();
    }
    expect(first.world.arenas[0]?.balls[0]?.x).toBe(second.world.arenas[0]?.balls[0]?.x);
  });
});
