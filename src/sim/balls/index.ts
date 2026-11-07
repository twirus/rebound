import type { BallKind } from '../../content/types';
import { BallStatus, findBall, type Ball } from '../ball';
import type { ShapeContext } from '../shapes';
import { respawnNearCentre } from '../shapes/walls';
import type { BallBehavior } from './behavior';
import { seedBehavior } from './seed';
import {
  bouncyBehavior,
  chameleonBehavior,
  coreBehavior,
  emberBehavior,
  frostBehavior,
  phantomBehavior,
  stickyBehavior,
  voidBehavior,
} from './simple';
import { tickStatus } from './status';

/** Every ball behaviour, by the `kind` used in content/balls.ts. Plain types have none. */
const behaviors: Readonly<Record<BallKind, BallBehavior>> = {
  basic: {},
  heavy: {},
  light: {},
  sticky: stickyBehavior,
  bouncy: bouncyBehavior,
  chameleon: chameleonBehavior,
  frost: frostBehavior,
  ember: emberBehavior,
  seed: seedBehavior,
  core: coreBehavior,
  phantom: phantomBehavior,
  void: voidBehavior,
};

/** A ball this far beyond the arena (as a share of its radius) has left it for good. */
const LOST_SHARE = 1.5;
const RESPAWN_SHARE = 0.3;
const RESPAWN_SPEED = 160;

/** Runs wall-hit hooks for every wall hit the ball made since event `firstEvent`. */
export function afterWallContact(ball: Ball, firstEvent: number, context: ShapeContext): void {
  const behavior = behaviors[ball.kind];
  if (!behavior.onWallHit) return;
  const { events } = context;
  for (let index = firstEvent; index < events.count; index++) {
    if (events.at(index).kind !== 'wall-hit') continue;
    behavior.onWallHit(ball, findBall(ball.typeId).params ?? {}, context);
  }
}

export function afterTouch(first: Ball, second: Ball, context: ShapeContext): void {
  behaviors[first.kind].onTouch?.(first, second, findBall(first.typeId).params ?? {}, context);
  behaviors[second.kind].onTouch?.(second, first, findBall(second.typeId).params ?? {}, context);
}

/** Per-tick upkeep: statuses run out, type hooks run, lost balls come back. */
export function tickBalls(context: ShapeContext): void {
  const { arena, arenaIndex, events, rng } = context;
  for (const ball of arena.balls) {
    if (tickStatus(ball) && ball.kind === 'sticky') {
      events.push('unstick', arenaIndex, ball.x, ball.y, 0, ball);
    }
    const onTick = behaviors[ball.kind].onTick;
    if (onTick) onTick(ball, findBall(ball.typeId).params ?? {}, context);
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    if (distance > arena.radius * LOST_SHARE) {
      ball.status = BallStatus.free;
      ball.statusTicks = 0;
      respawnNearCentre(ball, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
    }
  }
}
