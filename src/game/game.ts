import type { NodeId } from '../content/types';
import { TICK_SECONDS } from '../sim/constants';
import { queuePush } from '../sim/push';
import { stepWorld } from '../sim/step';
import { createWorld, findShape, spawnBall, type Arena, type World } from '../sim/world';
import { AUTO_TAP_DEPTH, AUTO_TAP_REACH, TAP_REACH } from './balance';
import { IncomeTracker } from './incomeTracker';
import { buyLevel } from './purchases';
import type { GameState } from './state';
import { computeStats, type Stats } from './stats';

const IMPULSE = 'resource:impulse';
const MAIN_ARENA = 0;

/** Owns the world and the saved state; the only place where resources change. */
export class Game {
  readonly world: World;
  readonly income = new IncomeTracker();
  private stats: Stats;
  private lastTapTick = Number.NEGATIVE_INFINITY;
  private nextAutoTapTick = 0;

  constructor(
    readonly state: GameState,
    seed: number,
  ) {
    this.world = createWorld(seed);
    this.stats = computeStats(state.nodeLevels);
    this.applyStats();
  }

  get currentStats(): Stats {
    return this.stats;
  }

  step(): void {
    stepWorld(this.world);
    this.collectIncome();
    this.runAutoTap();
    this.income.endTick();
  }

  /** Seconds until the tap is ready again; 0 when ready. */
  tapCooldownLeft(): number {
    const readyTick = this.lastTapTick + this.stats['stat:tap-cooldown'] / TICK_SECONDS;
    return Math.max(0, (readyTick - this.world.tick) * TICK_SECONDS);
  }

  /** Tap at a point in arena coordinates. Returns false while on cooldown. */
  tap(x: number, y: number): boolean {
    if (this.tapCooldownLeft() > 0) return false;
    const arena = this.mainArena();
    queuePush(this.world, {
      arenaIndex: MAIN_ARENA,
      x,
      y,
      strength: this.stats['stat:tap-strength'],
      reach: arena.radius * TAP_REACH,
    });
    this.lastTapTick = this.world.tick;
    return true;
  }

  buy(nodeId: NodeId): boolean {
    if (!buyLevel(this.state, nodeId, this.stats)) return false;
    this.stats = computeStats(this.state.nodeLevels);
    this.applyStats();
    return true;
  }

  private mainArena(): Arena {
    const arena = this.world.arenas[MAIN_ARENA];
    if (!arena) throw new Error('Main arena is missing');
    return arena;
  }

  private applyStats(): void {
    const arena = this.mainArena();
    arena.radius = findShape(arena.shapeId).radius * this.stats['stat:arena-scale'];
    arena.minBounceSpeed = this.stats['stat:min-bounce-speed'];
    while (arena.balls.length < this.stats['stat:ball-count']) {
      spawnBall(this.world, arena, 'ball:basic');
    }
  }

  private collectIncome(): void {
    const events = this.world.events;
    let earned = 0;
    for (let index = 0; index < events.count; index++) {
      const event = events.at(index);
      if (event.kind === 'wall-hit') earned += this.stats['stat:impulse-per-hit'];
      else if (event.kind === 'ball-collision') earned += this.stats['stat:impulse-per-collision'];
    }
    if (earned === 0) return;
    this.state.resources[IMPULSE] = (this.state.resources[IMPULSE] ?? 0) + earned;
    this.income.add(IMPULSE, earned);
  }

  private runAutoTap(): void {
    if (this.stats['stat:auto-tap'] < 1 || this.world.tick < this.nextAutoTapTick) return;
    const arena = this.mainArena();
    queuePush(this.world, {
      arenaIndex: MAIN_ARENA,
      x: 0,
      y: arena.radius * AUTO_TAP_DEPTH,
      strength: this.stats['stat:tap-strength'],
      reach: arena.radius * AUTO_TAP_REACH,
    });
    this.nextAutoTapTick =
      this.world.tick + Math.round(this.stats['stat:auto-tap-interval'] / TICK_SECONDS);
  }
}
