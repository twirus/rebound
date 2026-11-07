import { limitSpeed } from './physics';
import type { Arena, World } from './world';

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

/**
 * Pushes balls away from a point, fading to nothing at `reach`; a ball exactly
 * at the point goes straight up. A negative strength pulls instead.
 */
export function pushAround(
  arena: Arena,
  x: number,
  y: number,
  strength: number,
  reach: number,
): void {
  for (const ball of arena.balls) {
    const dx = ball.x - x;
    const dy = ball.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= reach) continue;
    const falloff = 1 - distance / reach;
    const directionX = distance === 0 ? 0 : dx / distance;
    const directionY = distance === 0 ? -1 : dy / distance;
    ball.vx += directionX * strength * falloff;
    ball.vy += directionY * strength * falloff;
    limitSpeed(ball, ball.maxSpeed);
  }
}

function applyPush(world: World, push: PushInput): void {
  const arena = world.arenas[push.arenaIndex];
  if (!arena) return;
  pushAround(arena, push.x, push.y, push.strength, push.reach);
  world.events.push('push', push.arenaIndex, push.x, push.y, push.reach);
}

export function applyPendingPushes(world: World): void {
  for (const push of world.pendingPushes) applyPush(world, push);
  world.pendingPushes.length = 0;
}
