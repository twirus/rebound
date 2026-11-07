import { detCos, detSin } from '../../core/detMath';
import type { GemId, GemParams } from '../../content/types';
import { BallStatus, resizeBall, type Ball } from '../ball';
import { startStatus } from '../balls/status';
import { TICK_SECONDS } from '../constants';
import type { SimEvent } from '../events';
import type { ShapeContext } from '../shapes';
import { respawnNearCentre } from '../shapes/walls';
import { findGem } from './scheme';

/** Hooks a law may use; laws that only change earnings (egoist, debt) have none here. */
interface LawBehavior {
  onTick?(params: GemParams, context: ShapeContext): void;
  onEvent?(event: SimEvent, params: GemParams, context: ShapeContext): void;
  onTouch?(first: Ball, second: Ball, params: GemParams, context: ShapeContext): void;
  /** How fast time runs for this ball (1 is normal). */
  timeScale?(ball: Ball, params: GemParams): number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;
/** Heat a thermo ball loses per second. */
const THERMO_COOL_PER_SECOND = 1;
/** Above the "hot" heat by this much, a thermo ball melts through the wall. */
const THERMO_MELT_MARGIN = 3;
/** A hungry ball swallows one at least this much smaller (by radius). */
const HUNGER_BITE_RATIO = 1.2;
const RESPAWN_SHARE = 0.3;
const RESPAWN_SPEED = 160;

function sizeOf(ball: Ball): number {
  return ball.baseRadius > 0 ? ball.radius / ball.baseRadius : 1;
}

function nearest(from: Ball, balls: readonly Ball[]): Ball | null {
  let best: Ball | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const ball of balls) {
    const gap = Math.hypot(ball.x - from.x, ball.y - from.y);
    if (ball !== from && gap < distance) {
      distance = gap;
      best = ball;
    }
  }
  return best;
}

const LAWS: Readonly<Partial<Record<GemId, LawBehavior>>> = {
  'law:tides': {
    onTick(params, { arena }) {
      const turn = (params.strength ?? 0) * DEGREES_TO_RADIANS * TICK_SECONDS;
      const { gravityX, gravityY } = arena;
      arena.gravityX = gravityX * detCos(turn) - gravityY * detSin(turn);
      arena.gravityY = gravityX * detSin(turn) + gravityY * detCos(turn);
    },
  },
  'law:flock': {
    // Every ball eases towards the flock's average heading; O(n), so it scales to big flocks.
    onTick(params, { arena }) {
      const count = arena.balls.length;
      if (count < 2) return;
      let averageX = 0;
      let averageY = 0;
      for (const ball of arena.balls) {
        averageX += ball.vx / count;
        averageY += ball.vy / count;
      }
      const ease = Math.min(1, (params.strength ?? 0) * TICK_SECONDS);
      for (const ball of arena.balls) {
        ball.vx += (averageX - ball.vx) * ease;
        ball.vy += (averageY - ball.vy) * ease;
      }
    },
  },
  'law:hourglass': {
    timeScale: (ball, params) => (ball.y < 0 ? (params.multiplier ?? 1) : (params.penalty ?? 1)),
  },
  'law:thermo': {
    onEvent(event, params, { arena }) {
      if (event.kind !== 'wall-hit') return;
      const ball = arena.balls.find((candidate) => candidate.id === event.ballId);
      if (!ball) return;
      ball.heat += params.strength ?? 0;
      const melting = ball.heat >= (params.count ?? 0) + THERMO_MELT_MARGIN;
      if (melting && ball.status === BallStatus.free) {
        startStatus(ball, BallStatus.phasing, params.seconds ?? 0);
        ball.heat = 0;
      }
    },
    onTick(_params, { arena }) {
      for (const ball of arena.balls) {
        ball.heat = Math.max(0, ball.heat - THERMO_COOL_PER_SECOND * TICK_SECONDS);
      }
    },
  },
  'law:legacy': {
    onEvent(event, _params, { arena }) {
      if (event.kind !== 'vanish') return;
      const gone = arena.balls.find((candidate) => candidate.id === event.ballId);
      const heir = gone && nearest(gone, arena.balls);
      if (!gone || !heir) return;
      resizeBall(heir, Math.max(sizeOf(heir), sizeOf(gone)));
      heir.heat = Math.max(heir.heat, gone.heat);
      if (gone.tint >= 0) heir.tint = gone.tint;
    },
  },
  'law:hunger': {
    onTick(params, { arena, arenaIndex, events, rng }) {
      const shrink = 1 - (params.strength ?? 0) * TICK_SECONDS;
      for (const ball of arena.balls) {
        resizeBall(ball, sizeOf(ball) * shrink);
        if (sizeOf(ball) >= (params.penalty ?? 0)) continue;
        events.push('vanish', arenaIndex, ball.x, ball.y, 0, ball);
        resizeBall(ball, 1);
        respawnNearCentre(ball, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
      }
    },
    onTouch(first, second, params, { arena, arenaIndex, events, rng }) {
      const [big, small] = first.radius >= second.radius ? [first, second] : [second, first];
      if (big.radius < small.radius * HUNGER_BITE_RATIO || small.heldTicks > 0) return;
      const grown = Math.sqrt(big.radius ** 2 + small.radius ** 2) / big.baseRadius;
      resizeBall(big, Math.min(params.multiplier ?? 1, grown));
      resizeBall(small, 1);
      respawnNearCentre(small, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
      events.push('merge', arenaIndex, big.x, big.y, big.radius, big);
    },
  },
  'law:entropy': {
    // Random shoves, stronger the longer the arena is left alone (arena.entropy, set by the game).
    onTick(params, { arena, rng }) {
      const shove = (params.strength ?? 0) * arena.entropy * TICK_SECONDS;
      if (shove === 0) return;
      for (const ball of arena.balls) {
        ball.vx += rng.nextRange(-shove, shove);
        ball.vy += rng.nextRange(-shove, shove);
      }
    },
  },
};

function lawOf(context: ShapeContext): { behavior: LawBehavior; params: GemParams } | null {
  const id = context.arena.law;
  const behavior = id ? LAWS[id] : undefined;
  return id && behavior ? { behavior, params: findGem(id).params ?? {} } : null;
}

/** Runs the arena law over this tick's events, then its per-tick rule. */
export function runLaw(context: ShapeContext, firstEvent: number): void {
  const law = lawOf(context);
  if (!law) return;
  const { events, arenaIndex } = context;
  if (law.behavior.onEvent) {
    for (let index = firstEvent; index < events.count; index++) {
      const event = events.at(index);
      if (event.arenaIndex === arenaIndex) law.behavior.onEvent(event, law.params, context);
    }
  }
  law.behavior.onTick?.(law.params, context);
}

export function lawTouch(first: Ball, second: Ball, context: ShapeContext): void {
  const law = lawOf(context);
  law?.behavior.onTouch?.(first, second, law.params, context);
}

/** How fast time runs for the ball under the arena law. */
export function lawTimeScale(context: ShapeContext, ball: Ball): number {
  const law = lawOf(context);
  return law?.behavior.timeScale?.(ball, law.params) ?? 1;
}
