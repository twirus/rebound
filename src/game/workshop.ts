import type { BallId, ShapeId } from '../content/types';
import { queuePush } from '../sim/push';
import { stepWorld } from '../sim/step';
import { createWorld, findShape, setArenaShape, spawnBall, type World } from '../sim/world';
import { TAP_SANDBOX_REACH, TAP_SANDBOX_STRENGTH } from './balance';

/** Everything the player can turn in the Workshop. */
export interface WorkshopSettings {
  shape: ShapeId;
  ball: BallId;
  ballCount: number;
  /** Multiplier on the shape's own gravity. */
  gravity: number;
  /** Multiplier on the shape's size. */
  size: number;
  /** Speed walls kick slow balls up to. */
  bounce: number;
}

/** Ranges of the Workshop sliders: [min, max, step]. */
export const WORKSHOP_LIMITS = {
  ballCount: [1, 60, 1],
  gravity: [0, 2, 0.05],
  size: [0.6, 1.4, 0.05],
  bounce: [0, 900, 10],
} as const satisfies Partial<Record<keyof WorkshopSettings, readonly [number, number, number]>>;

export const DEFAULT_WORKSHOP: WorkshopSettings = {
  shape: 'shape:circle',
  ball: 'ball:basic',
  ballCount: 8,
  gravity: 1,
  size: 1,
  bounce: 300,
};

/** The sandbox seed is fixed: the same settings always replay the same way. */
const WORKSHOP_SEED = 20_260_307;

/**
 * A separate world to play with: no income, no saving, nothing it does
 * reaches the game. Any settings change rebuilds it from scratch.
 */
export class Workshop {
  world: World = createWorld(WORKSHOP_SEED);

  constructor(private settings: WorkshopSettings) {
    this.rebuild(settings);
  }

  rebuild(settings: WorkshopSettings): void {
    this.settings = settings;
    const world = createWorld(WORKSHOP_SEED);
    const arena = world.arenas[0];
    if (!arena) throw new Error('Workshop arena is missing');
    const def = findShape(settings.shape);
    setArenaShape(world, arena, def, def.radius * settings.size);
    arena.gravity = (def.gravity ?? 1) * settings.gravity;
    arena.minBounceSpeed = settings.bounce;
    const room = Math.min(settings.ballCount, def.maxBalls ?? Number.POSITIVE_INFINITY);
    for (let count = 0; count < room; count++) spawnBall(world, arena, settings.ball);
    this.world = world;
  }

  step(): void {
    stepWorld(this.world);
  }

  tap(x: number, y: number): void {
    const arena = this.world.arenas[0];
    if (!arena) return;
    queuePush(this.world, {
      arenaIndex: 0,
      x,
      y,
      strength: TAP_SANDBOX_STRENGTH,
      reach: arena.radius * TAP_SANDBOX_REACH,
    });
  }

  get current(): WorkshopSettings {
    return this.settings;
  }
}
