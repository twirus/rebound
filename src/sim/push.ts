import { MAX_BALL_SPEED } from './constants';
import { limitSpeed } from './physics';
import type { World } from './world';

export interface PushInput {
  arenaIndex: number;
  x: number;
  y: number;
  strength: number;
  /** Distance at which the push fades to zero. */
  reach: number;
}

/** Inputs are queued and applied at the start of the next tick, so replays stay exact. */
export function queuePush(world: World, push: PushInput): void {
  if (!world.arenas[push.arenaIndex]) throw new Error(`No arena ${push.arenaIndex}`);
  world.pendingPushes.push(push);
}

/** Pushes balls away from a point; a ball exactly at the point is pushed straight up. */
function applyPush(world: World, push: PushInput): void {
  const arena = world.arenas[push.arenaIndex];
  if (!arena) return;
  for (const ball of arena.balls) {
    const dx = ball.x - push.x;
    const dy = ball.y - push.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= push.reach) continue;
    const falloff = 1 - distance / push.reach;
    const directionX = distance === 0 ? 0 : dx / distance;
    const directionY = distance === 0 ? -1 : dy / distance;
    ball.vx += directionX * push.strength * falloff;
    ball.vy += directionY * push.strength * falloff;
    limitSpeed(ball, MAX_BALL_SPEED);
  }
  world.events.push('push', push.arenaIndex, push.x, push.y, push.reach);
}

export function applyPendingPushes(world: World): void {
  for (const push of world.pendingPushes) applyPush(world, push);
  world.pendingPushes.length = 0;
}
