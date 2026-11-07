import { BallStatus, clearBallState } from '../ball';
import { TICK_SECONDS } from '../constants';
import { respawnNearCentre } from '../shapes/walls';
import type { BallBehavior } from './behavior';
import { startStatus } from './status';

/** Balls that burn out or shatter come back near the centre, within this share of the radius. */
const RESPAWN_SHARE = 0.3;
const RESPAWN_SPEED = 160;
/** Close enough to the speed cap for a bouncy ball to risk shattering. */
const DANGER_SHARE = 0.95;

/** Clings to the wall it hit for a moment, then carries on with its bounce. */
export const stickyBehavior: BallBehavior = {
  onWallHit(ball, params) {
    if (ball.status !== BallStatus.free) return;
    startStatus(ball, BallStatus.stuck, params.stickSeconds ?? 0);
  },
};

/** Speeds up with every hit; at the cap each hit may shatter it (it comes back slow). */
export const bouncyBehavior: BallBehavior = {
  onWallHit(ball, params, { arena, arenaIndex, events, rng }) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed >= ball.maxSpeed * DANGER_SHARE && rng.nextFloat() < (params.shatterChance ?? 0)) {
      events.push('vanish', arenaIndex, ball.x, ball.y, speed, ball);
      respawnNearCentre(ball, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
      return;
    }
    const gain = 1 + (params.speedGainPerHit ?? 0);
    ball.vx *= gain;
    ball.vy *= gain;
  },
};

/** Takes the next colour on every hit. */
export const chameleonBehavior: BallBehavior = {
  onWallHit(ball, params) {
    const colors = params.colorCount ?? 1;
    ball.tint = (ball.tint + 1 + colors) % colors;
    ball.streak = 0;
  },
};

/** Freezes any ball it bumps into for a moment. */
export const frostBehavior: BallBehavior = {
  onTouch(_ball, other, params) {
    if (other.kind === 'frost' || other.kind === 'void') return;
    if (other.status !== BallStatus.free || other.heldTicks > 0) return;
    startStatus(other, BallStatus.frozen, params.freezeSeconds ?? 0);
  },
};

/**
 * Heats up with every hit and cools over time. Hot enough, it melts through
 * the wall once; too hot, it burns out and comes back cold.
 */
export const emberBehavior: BallBehavior = {
  onWallHit(ball, params, { arena, arenaIndex, events, rng }) {
    ball.heat += params.heatPerHit ?? 0;
    if (ball.heat >= (params.burnHeat ?? Number.POSITIVE_INFINITY)) {
      events.push('vanish', arenaIndex, ball.x, ball.y, ball.heat, ball);
      ball.heat = 0;
      respawnNearCentre(ball, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
      return;
    }
    const melting = ball.heat >= (params.meltHeat ?? Number.POSITIVE_INFINITY);
    if (melting && ball.status === BallStatus.free) {
      startStatus(ball, BallStatus.phasing, params.phaseSeconds ?? 0);
    }
  },
  onTick(ball, params) {
    ball.heat = Math.max(0, ball.heat - (params.coolPerSecond ?? 0) * TICK_SECONDS);
  },
};

/** Pulls nearby balls towards itself, harder the closer they are. */
export const coreBehavior: BallBehavior = {
  onTick(ball, params, { arena }) {
    const reach = params.pullRadius ?? 0;
    const strength = (params.pullStrength ?? 0) * TICK_SECONDS;
    for (const other of arena.balls) {
      if (other === ball) continue;
      const dx = ball.x - other.x;
      const dy = ball.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= reach || distance === 0) continue;
      const pull = strength * (1 - distance / reach);
      other.vx += (dx / distance) * pull;
      other.vy += (dy / distance) * pull;
    }
  },
};

/** Every few hits slips through the next wall it meets (and comes back in the centre). */
export const phantomBehavior: BallBehavior = {
  onWallHit(ball, params) {
    ball.hits += 1;
    if (ball.hits % (params.everyHits ?? Number.POSITIVE_INFINITY) !== 0) return;
    startStatus(ball, BallStatus.phasing, params.phaseSeconds ?? 0);
  },
};

/** Wipes every status off the balls it touches: no freeze, no heat, no colour. */
export const voidBehavior: BallBehavior = {
  onTouch(_ball, other) {
    if (other.heldTicks > 0) return;
    const wasStill = other.status === BallStatus.stuck || other.status === BallStatus.frozen;
    clearBallState(other);
    if (wasStill) {
      other.vx = other.storedVx;
      other.vy = other.storedVy;
    }
  },
};
