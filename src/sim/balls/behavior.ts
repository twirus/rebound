import type { BallParams } from '../../content/types';
import type { Ball } from '../ball';
import type { ShapeContext } from '../shapes';

/** Hooks a ball type may add on top of plain flying and bouncing. */
export interface BallBehavior {
  /** Right after the ball hit a wall (the bounce is already done). */
  onWallHit?(ball: Ball, params: BallParams, context: ShapeContext): void;
  /** Right after the ball bumped into `other`. */
  onTouch?(ball: Ball, other: Ball, params: BallParams, context: ShapeContext): void;
  /** Once per tick, after the balls moved. */
  onTick?(ball: Ball, params: BallParams, context: ShapeContext): void;
}
