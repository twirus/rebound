import { resources } from '../content/resources';
import type { BallId, GemId, NodeId, ResourceId, ShapeId } from '../content/types';
import { TICK_SECONDS } from '../sim/constants';
import { queuePush, type PushInput } from '../sim/push';
import { applyBallType, clearBallState } from '../sim/ball';
import { permanentBallCount } from '../sim/clones';
import { setArenaSchemes } from '../sim/gems';
import { stepWorld } from '../sim/step';
import {
  createWorld,
  ballSizeScale,
  findShape,
  setArenaShape,
  spawnBall,
  type Arena,
  type World,
} from '../sim/world';
import {
  AUTO_TAP_DEPTH,
  AUTO_TAP_REACH,
  TAP_ECHO_DELAY_SECONDS,
  TAP_ECHO_STRENGTH,
} from './balance';
import { TickEarnings } from './earnings';
import { SchemeRates } from './schemeRates';
import {
  clearSlot,
  placeGem,
  placeProblem,
  schemeSpecs,
  type GemSlotRef,
  type PlaceProblem,
} from './gemRules';
import { IncomeTracker } from './incomeTracker';
import { buyLevel } from './purchases';
import { DEFAULT_ARENA, type GameState } from './state';
import { tunedShape } from './shapeTuning';
import { computeStats, type Stats } from './stats';
import { unlockedBalls, unlockedShapes } from './unlocks';

const MASS: ResourceId = 'resource:mass';
const MAIN_ARENA = 0;

interface ScheduledPush {
  tick: number;
  push: PushInput;
}

/** Owns the world and the saved state; the only place where resources change. */
export class Game {
  readonly world: World;
  readonly income = new IncomeTracker();
  readonly schemeRates = new SchemeRates();
  private stats: Stats;
  private lastTapTick = Number.NEGATIVE_INFINITY;
  private nextAutoTapTick = 0;
  private echo: ScheduledPush | null = null;
  private readonly earnings = new TickEarnings();
  /** Fingerprint of the walls last built, so purchases do not reset them needlessly. */
  private builtShapeKey = '';
  /** Fingerprint of the schemes last sent to the arena, so cooldowns survive unrelated changes. */
  private builtSchemesKey = '';

  constructor(
    readonly state: GameState,
    seed: number,
  ) {
    this.world = createWorld(seed);
    this.stats = computeStats(state.nodeLevels);
    // A save may point at content that is no longer unlocked; fall back rather than fail.
    if (!unlockedShapes(state.nodeLevels).includes(state.arena.shape)) {
      state.arena.shape = DEFAULT_ARENA.shape;
    }
    if (!unlockedBalls(state.nodeLevels).includes(state.arena.ball)) {
      state.arena.ball = DEFAULT_ARENA.ball;
    }
    this.applyStats();
  }

  get currentStats(): Stats {
    return this.stats;
  }

  step(): void {
    stepWorld(this.world);
    this.collectIncome();
    this.runAutoTap();
    this.runEcho();
    this.income.endTick();
    this.schemeRates.record(this.world.tick, this.mainArena().schemes);
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
    const push: PushInput = {
      arenaIndex: MAIN_ARENA,
      x,
      y,
      strength: this.stats['stat:tap-strength'],
      reach: arena.radius * this.stats['stat:tap-reach'],
    };
    queuePush(this.world, push);
    if (this.stats['stat:tap-echo'] >= 1) {
      this.echo = {
        tick: this.world.tick + Math.round(TAP_ECHO_DELAY_SECONDS / TICK_SECONDS),
        push: { ...push, strength: push.strength * TAP_ECHO_STRENGTH },
      };
    }
    this.lastTapTick = this.world.tick;
    return true;
  }

  /** Arena panel: switch the arena to an unlocked shape. */
  setShape(shapeId: ShapeId): boolean {
    if (!unlockedShapes(this.state.nodeLevels).includes(shapeId)) return false;
    this.state.arena.shape = shapeId;
    this.applyStats();
    return true;
  }

  /** Arena panel: put a gem into a slot (moving it from wherever it was). */
  placeGem(slot: GemSlotRef, gemId: GemId): PlaceProblem | null {
    const problem = placeProblem(this.state.arena, slot, gemId, this.state.nodeLevels, this.stats);
    if (problem) return problem;
    placeGem(this.state.arena, slot, gemId);
    this.buildSchemes();
    return null;
  }

  clearGemSlot(slot: GemSlotRef): void {
    clearSlot(this.state.arena, slot);
    this.buildSchemes();
  }

  /** Arena panel: switch every ball in the arena to an unlocked type. */
  setBall(ballId: BallId): boolean {
    if (!unlockedBalls(this.state.nodeLevels).includes(ballId)) return false;
    this.state.arena.ball = ballId;
    const arena = this.mainArena();
    for (const ball of arena.balls) {
      applyBallType(ball, ballId, ballSizeScale(arena));
      clearBallState(ball);
    }
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
    this.buildShape(arena);
    this.buildSchemes();
    arena.minBounceSpeed = this.stats['stat:min-bounce-speed'];
    const shapeLimit = findShape(this.state.arena.shape).maxBalls ?? Number.POSITIVE_INFINITY;
    const wanted = Math.min(this.stats['stat:ball-count'], shapeLimit);
    // Clones come and go on their own; only permanent balls follow the stats.
    if (permanentBallCount(arena) > wanted) {
      arena.balls = arena.balls.filter((ball) => !ball.clone).slice(0, wanted);
    }
    while (permanentBallCount(arena) < wanted) {
      spawnBall(this.world, arena, this.state.arena.ball);
    }
  }

  private buildSchemes(): void {
    const specs = schemeSpecs(this.state.arena, this.stats);
    const key = JSON.stringify(specs);
    if (key === this.builtSchemesKey) return;
    setArenaSchemes(this.mainArena(), specs);
    this.builtSchemesKey = key;
  }

  /** Rebuilds the walls only when the shape, its upgrades or the arena size changed. */
  private buildShape(arena: Arena): void {
    const def = tunedShape(findShape(this.state.arena.shape), this.stats);
    const radius = def.radius * this.stats['stat:arena-scale'];
    const key = JSON.stringify([def, radius]);
    if (key === this.builtShapeKey) return;
    setArenaShape(this.world, arena, def, radius);
    this.builtShapeKey = key;
  }

  private collectIncome(): void {
    this.earnings.collect(this.world.events, this.stats);
    const amounts = this.earnings.amounts;
    amounts[MASS] = (amounts[MASS] ?? 0) + this.overflowMass();
    for (const resource of resources) this.earn(resource.id, amounts[resource.id] ?? 0);
  }

  /** Balls the current shape has no room for wait outside and condense into Mass. */
  private overflowMass(): number {
    const limit = findShape(this.state.arena.shape).maxBalls ?? Number.POSITIVE_INFINITY;
    const waiting = Math.max(0, this.stats['stat:ball-count'] - limit);
    return waiting * this.stats['stat:mass-per-waiting-ball'] * TICK_SECONDS;
  }

  private earn(resource: ResourceId, amount: number): void {
    if (amount === 0) return;
    this.state.resources[resource] = (this.state.resources[resource] ?? 0) + amount;
    this.income.add(resource, amount);
  }

  private runAutoTap(): void {
    if (this.stats['stat:auto-tap'] < 1 || this.world.tick < this.nextAutoTapTick) return;
    const arena = this.mainArena();
    queuePush(this.world, {
      arenaIndex: MAIN_ARENA,
      x: 0,
      y: arena.radius * AUTO_TAP_DEPTH,
      strength: this.stats['stat:tap-strength'] * this.stats['stat:auto-tap-power'],
      reach: arena.radius * AUTO_TAP_REACH,
    });
    this.nextAutoTapTick =
      this.world.tick + Math.round(this.stats['stat:auto-tap-interval'] / TICK_SECONDS);
  }

  private runEcho(): void {
    if (!this.echo || this.world.tick < this.echo.tick) return;
    queuePush(this.world, this.echo.push);
    this.echo = null;
  }
}
