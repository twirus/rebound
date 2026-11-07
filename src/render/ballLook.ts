import { BallStatus, findBall, type Ball } from '../sim/ball';
import { TICK_SECONDS } from '../sim/constants';
import { findShape } from '../sim/world';

const CLONE_ALPHA = 0.6;
/** Copies fade out over their last this many seconds. */
const CLONE_FADE_SECONDS = 1;
const FROZEN_COLOR = '#a8d8e8';
const PHASING_ALPHA = 0.35;
/** An ember this hot glows bright. */
const GLOW_HEAT = 7;
const GLOW_COLOR = '#ff8a4a';

/** Colours a tinted ball takes: the hexagon's, shared by chameleons everywhere. */
const TINT_COLORS = findShape('shape:hexagon').hexagon?.colors ?? [];

export interface BallLook {
  color: string;
  alpha: number;
}

/** Colour and opacity of a ball from its type and what is happening to it. Reused object. */
export function lookOf(ball: Ball, look: BallLook): BallLook {
  const def = findBall(ball.typeId);
  look.color = TINT_COLORS[ball.tint] ?? def.color;
  if (ball.status === BallStatus.frozen) look.color = FROZEN_COLOR;
  if (ball.kind === 'ember' && ball.heat >= GLOW_HEAT) look.color = GLOW_COLOR;
  look.alpha = 1;
  if (ball.clone) {
    look.alpha = CLONE_ALPHA * Math.min(1, (ball.lifeTicks * TICK_SECONDS) / CLONE_FADE_SECONDS);
  }
  if (ball.status === BallStatus.phasing) look.alpha = PHASING_ALPHA;
  return look;
}
