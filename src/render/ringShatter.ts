import type { World } from '../sim/world';

const DURATION_MS = 480;
/** About one fragment per this many world units of ring length, within the bounds below. */
const FRAGMENT_LENGTH = 34;
const MIN_FRAGMENTS = 6;
const MAX_FRAGMENTS = 16;
/** Empty space between neighbouring fragments, as a share of each fragment's angle. */
const FRAGMENT_GAP_SHARE = 0.18;
/** How far fragments drift outward over the whole effect, CSS pixels. */
const DRIFT_PX = 26;
/** Extra outward drift for fragments near the gap, where the ball punched through. */
const PUNCH_DRIFT_PX = 18;
/** Fragments twist this far (radians) as they fly; alternate ones twist the other way. */
const TWIST = 0.18;
/** Sparks at the point of impact. */
const SPARKS = 5;
const SPARK_SIZE_PX = 2.5;
const SPARK_DRIFT_PX = 34;
const SPARK_SPREAD = 0.5;
const MAX_ACTIVE = 24;
const FULL_TURN = Math.PI * 2;

interface Shatter {
  radius: number;
  /** Direction of the gap the ball went through. */
  gapAngle: number;
  halfGap: number;
  startMs: number;
}

function easeOut(progress: number): number {
  return 1 - (1 - progress) * (1 - progress) * (1 - progress);
}

/**
 * A broken ring falls apart into arcs that drift outward, twist and fade, with
 * a few sparks where the ball broke through. Purely visual.
 */
export class RingShatter {
  private readonly active: Shatter[] = [];

  collect(world: World, arenaIndex: number, nowMs: number): void {
    const arena = world.arenas[arenaIndex];
    if (!arena || arena.shape.kind !== 'rings') return;
    const halfGap = Math.acos(arena.shape.gapCos);
    const events = world.events;
    for (let index = 0; index < events.count; index++) {
      const event = events.at(index);
      if (event.kind !== 'ring-break' || event.arenaIndex !== arenaIndex) continue;
      if (this.active.length >= MAX_ACTIVE) this.active.shift();
      this.active.push({
        radius: event.strength,
        gapAngle: Math.atan2(event.y, event.x),
        halfGap,
        startMs: nowMs,
      });
    }
  }

  /** Draws in arena coordinates; `scale` converts CSS pixels to world units. */
  draw(
    context: CanvasRenderingContext2D,
    color: string,
    lineWidth: number,
    scale: number,
    nowMs: number,
  ): void {
    while (this.active[0] && nowMs - this.active[0].startMs > DURATION_MS) this.active.shift();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineCap = 'round';
    for (const shatter of this.active) {
      const progress = (nowMs - shatter.startMs) / DURATION_MS;
      this.drawFragments(context, shatter, progress, lineWidth, scale);
      this.drawSparks(context, shatter, progress, scale);
    }
    context.globalAlpha = 1;
  }

  private drawFragments(
    context: CanvasRenderingContext2D,
    shatter: Shatter,
    progress: number,
    lineWidth: number,
    scale: number,
  ): void {
    const eased = easeOut(progress);
    const arc = FULL_TURN - shatter.halfGap * 2;
    const count = Math.min(
      MAX_FRAGMENTS,
      Math.max(MIN_FRAGMENTS, Math.round((shatter.radius * arc) / FRAGMENT_LENGTH)),
    );
    const step = arc / count;
    const fragment = step * (1 - FRAGMENT_GAP_SHARE);
    context.globalAlpha = (1 - progress) * (1 - progress);
    context.lineWidth = lineWidth * (1 - progress * 0.6);
    for (let index = 0; index < count; index++) {
      const middle = shatter.gapAngle + shatter.halfGap + step * (index + 0.5);
      // 1 next to the gap, 0 on the far side: the punch-through side flies harder.
      const nearGap = Math.abs(Math.cos((middle - shatter.gapAngle) / 2));
      const drift = ((DRIFT_PX + PUNCH_DRIFT_PX * nearGap) / scale) * eased;
      const twist = (index % 2 === 0 ? 1 : -1) * TWIST * eased;
      const centreX = Math.cos(middle) * drift;
      const centreY = Math.sin(middle) * drift;
      context.beginPath();
      context.arc(
        centreX,
        centreY,
        shatter.radius,
        middle - fragment / 2 + twist,
        middle + fragment / 2 + twist,
      );
      context.stroke();
    }
  }

  private drawSparks(
    context: CanvasRenderingContext2D,
    shatter: Shatter,
    progress: number,
    scale: number,
  ): void {
    const eased = easeOut(progress);
    const size = (SPARK_SIZE_PX / scale) * (1 - progress);
    const originX = Math.cos(shatter.gapAngle) * shatter.radius;
    const originY = Math.sin(shatter.gapAngle) * shatter.radius;
    context.globalAlpha = 1 - progress;
    for (let spark = 0; spark < SPARKS; spark++) {
      const spread = ((spark / (SPARKS - 1)) * 2 - 1) * SPARK_SPREAD;
      const angle = shatter.gapAngle + spread;
      const distance = (SPARK_DRIFT_PX / scale) * eased * (1 - Math.abs(spread) * 0.6);
      const x = originX + Math.cos(angle) * distance;
      const y = originY + Math.sin(angle) * distance;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
}
