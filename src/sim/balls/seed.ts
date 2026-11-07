import { detCos, detSin } from '../../core/detMath';
import { TICK_SECONDS } from '../constants';
import { spawnClone } from '../clones';
import type { BallBehavior } from './behavior';

/** Hatchlings fly off this far apart (radians), fanned around the direction of the seed. */
const HATCH_SPREAD = 0.6;
/** Hatchlings alive at once in one arena, in whole hatches. */
const HATCHES_ALIVE = 4;

/** Every few hits hatches a handful of small short-lived balls; hatchlings never hatch. */
export const seedBehavior: BallBehavior = {
  onWallHit(ball, params, { world, arena, arenaIndex, events }) {
    if (ball.clone) return;
    ball.hits += 1;
    if (ball.hits % (params.everyHits ?? Number.POSITIVE_INFINITY) !== 0) return;
    const count = params.hatchCount ?? 0;
    const lifeTicks = Math.round((params.hatchSeconds ?? 0) / TICK_SECONDS);
    for (let index = 0; index < count; index++) {
      const angle = (index - (count - 1) / 2) * HATCH_SPREAD;
      const turnCos = detCos(angle);
      const turnSin = detSin(angle);
      const vx = ball.vx * turnCos - ball.vy * turnSin;
      const vy = ball.vx * turnSin + ball.vy * turnCos;
      const hatchling = spawnClone(world, arena, ball, vx, vy, lifeTicks, count * HATCHES_ALIVE);
      if (!hatchling) break;
      events.push('spawn', arenaIndex, hatchling.x, hatchling.y, 0, hatchling);
      hatchling.radius *= params.hatchScale ?? 1;
      hatchling.mass = hatchling.radius * hatchling.radius;
    }
    events.push('hatch', arenaIndex, ball.x, ball.y, count, ball);
  },
};
