import type { GemId } from '../../content/types';
import type { Ball } from '../ball';
import type { SimEvent } from '../events';
import type { ShapeContext } from '../shapes';
import { respawnNearCentre } from '../shapes/walls';
import { EFFECTS } from './effects';
import { findGem, type Scheme } from './scheme';
import type { EffectTarget } from './target';

/** An effect waiting to land: delayed, an echo, or the next jump of a chain. */
export interface PendingEffect {
  tick: number;
  scheme: number;
  effect: GemId;
  x: number;
  y: number;
  ballId: number;
  power: number;
  depth: number;
  /** A chain jump lands on the nearest other ball; otherwise on the original one. */
  jump: boolean;
  /** Chain jumps still to come after this landing. */
  jumpsLeft: number;
  /** Balls the chain has already landed on; a jump never goes back to them. */
  visited: number[];
}

/** Fragile balls that hit their limit come back near the centre, within this share of the radius. */
const RESPAWN_SHARE = 0.3;
const RESPAWN_SPEED = 160;

const target: EffectTarget = { x: 0, y: 0, ball: null, power: 1, scheme: null, previous: null };

function ballById(context: ShapeContext, id: number): Ball | null {
  return id < 0 ? null : (context.arena.balls.find((ball) => ball.id === id) ?? null);
}

function largestBall(context: ShapeContext): Ball | null {
  let largest: Ball | null = null;
  for (const ball of context.arena.balls) {
    if (!largest || ball.radius > largest.radius) largest = ball;
  }
  return largest;
}

function nearestOther(
  context: ShapeContext,
  from: Ball,
  reach: number,
  visited: readonly number[],
): Ball | null {
  let nearest: Ball | null = null;
  let best = reach;
  for (const ball of context.arena.balls) {
    const distance = Math.hypot(ball.x - from.x, ball.y - from.y);
    if (!visited.includes(ball.id) && distance < best) {
      best = distance;
      nearest = ball;
    }
  }
  return nearest;
}

/** Runs the effect once on the target, or on every ball around it for an area scheme. */
function land(
  scheme: Scheme,
  effect: GemId,
  ball: Ball | null,
  power: number,
  context: ShapeContext,
): void {
  const handler = EFFECTS[effect];
  if (!handler) return;
  const params = findGem(effect).params ?? {};
  target.scheme = scheme;
  if (scheme.areaRadius <= 0) {
    target.ball = ball;
    target.power = power;
    handler(target, params, context);
    return;
  }
  const centreX = target.x;
  const centreY = target.y;
  for (const other of context.arena.balls) {
    if (Math.hypot(other.x - centreX, other.y - centreY) >= scheme.areaRadius) continue;
    target.ball = other;
    target.power = power * scheme.areaPower;
    handler(target, params, context);
  }
}

/** Counts firings on a fragile scheme's target; at the limit the ball breaks and returns. */
function wearOut(scheme: Scheme, ball: Ball | null, context: ShapeContext): void {
  if (scheme.fragileLimit <= 0 || !ball) return;
  ball.wear += 1;
  if (ball.wear < scheme.fragileLimit) return;
  ball.wear = 0;
  context.events.push('vanish', context.arenaIndex, ball.x, ball.y, 0, ball);
  respawnNearCentre(ball, context.arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, context.rng);
}

function queue(context: ShapeContext, pending: PendingEffect): void {
  context.arena.pendingEffects.push(pending);
}

/** Fires a scheme for an event: picks the target and effect, lands it now or later, schedules echoes and jumps. */
export function fireScheme(
  scheme: Scheme,
  schemeIndex: number,
  event: SimEvent,
  previous: SimEvent | null,
  context: ShapeContext,
): void {
  const { arena, events, rng, world } = context;
  const ball = scheme.focus ? largestBall(context) : ballById(context, event.ballId);
  const others = arena.schemes.filter((other) => other !== scheme);
  const borrowed = others[Math.floor(rng.nextFloat() * others.length)];
  const effect = scheme.chance && borrowed ? borrowed.effect : scheme.effect;
  const power = scheme.power * (1 + scheme.heat * scheme.overheatStep);
  const depth = event.depth + 1;
  const base = {
    scheme: schemeIndex,
    effect,
    x: event.x,
    y: event.y,
    ballId: ball?.id ?? -1,
    depth,
    visited: [ball?.id ?? -1],
  };
  events.depth = depth;
  events.scheme = schemeIndex;
  target.x = event.x;
  target.y = event.y;
  target.previous = previous;
  if (scheme.delayTicks > 0) {
    const tick = world.tick + scheme.delayTicks;
    queue(context, { ...base, tick, power, jump: false, jumpsLeft: scheme.chainJumps });
  } else {
    land(scheme, effect, ball, power, context);
    if (ball && scheme.chainJumps > 0) {
      const tick = world.tick + scheme.chainTicks;
      queue(context, { ...base, tick, power, jump: true, jumpsLeft: scheme.chainJumps - 1 });
    }
  }
  if (scheme.echoTicks > 0) {
    const tick = world.tick + scheme.echoTicks;
    queue(context, { ...base, tick, power: power * scheme.echoPower, jump: false, jumpsLeft: 0 });
  }
  wearOut(scheme, ball, context);
  recharge(scheme);
}

/** Starts the cooldown; an overheated scheme takes its long pause instead. */
function recharge(scheme: Scheme): void {
  scheme.cooldownLeft = scheme.cooldownTicks;
  // Counted in whole firings: adding 0.1 ten times does not quite reach 1.
  if (scheme.overheatStep > 0) scheme.heat += 1;
  if (scheme.overheatStep > 0 && scheme.heat >= Math.round(1 / scheme.overheatStep)) {
    scheme.heat = 0;
    scheme.cooldownLeft = scheme.overheatPauseTicks;
  }
  scheme.fired += 1;
}

/** Lands effects whose time has come; a chain jump lands on the nearest other ball and queues the next. */
export function runPending(context: ShapeContext): void {
  const { arena, events, world } = context;
  const due = arena.pendingEffects.filter((pending) => pending.tick <= world.tick);
  if (due.length === 0) return;
  arena.pendingEffects = arena.pendingEffects.filter((pending) => pending.tick > world.tick);
  for (const pending of due) {
    const scheme = arena.schemes[pending.scheme];
    if (!scheme) continue;
    const from = ballById(context, pending.ballId);
    const ball =
      pending.jump && from
        ? nearestOther(context, from, scheme.chainRadius, pending.visited)
        : from;
    if (pending.jump && !ball) continue;
    events.depth = pending.depth;
    events.scheme = pending.scheme;
    target.x = ball?.x ?? pending.x;
    target.y = ball?.y ?? pending.y;
    target.previous = null;
    land(scheme, pending.effect, ball, pending.power, context);
    // A delayed landing starts its chain here; each jump passes on what is left of it.
    if (ball && pending.jumpsLeft > 0) {
      const tick = world.tick + scheme.chainTicks;
      queue(context, {
        ...pending,
        tick,
        ballId: ball.id,
        jump: true,
        jumpsLeft: pending.jumpsLeft - 1,
        visited: [...pending.visited, ball.id],
      });
    }
  }
}
