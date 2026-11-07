import { findBall, type Ball } from '../sim/world';

const TRAIL_MS = 300;
/** Positions kept per ball; enough for 300 ms at high refresh rates. */
const CAPACITY = 48;
/** Trail width as a share of the ball diameter at its newest end. */
const WIDTH_SHARE = 0.7;
const TRAIL_ALPHA = 0.45;
/** Entries are (x, y, timeMs) triples in a ring buffer. */
const FIELDS = 3;
/** A ball that moved further than this in one frame was teleported (new round, new shape). */
const JUMP_DISTANCE = 60;

interface Trail {
  points: Float64Array;
  /** Index of the slot the next point goes into. */
  next: number;
  count: number;
}

/** Short fading line behind every ball, drawn from positions seen in recent frames. Visual only. */
export class BallTrails {
  private readonly trails = new Map<number, Trail>();
  private readonly seen = new Set<number>();

  /** Records the drawn position of each ball and forgets balls that are gone. */
  record(balls: readonly Ball[], positions: Float64Array, nowMs: number): void {
    this.seen.clear();
    balls.forEach((ball, index) => {
      this.seen.add(ball.id);
      let trail = this.trails.get(ball.id);
      if (!trail) {
        trail = { points: new Float64Array(CAPACITY * FIELDS), next: 0, count: 0 };
        this.trails.set(ball.id, trail);
      }
      const x = positions[index * 2] ?? 0;
      const y = positions[index * 2 + 1] ?? 0;
      if (trail.count > 0) {
        const last = ((trail.next - 1 + CAPACITY) % CAPACITY) * FIELDS;
        const jump = Math.hypot(x - (trail.points[last] ?? 0), y - (trail.points[last + 1] ?? 0));
        if (jump > JUMP_DISTANCE) trail.count = 0;
      }
      const offset = trail.next * FIELDS;
      trail.points[offset] = x;
      trail.points[offset + 1] = y;
      trail.points[offset + 2] = nowMs;
      trail.next = (trail.next + 1) % CAPACITY;
      trail.count = Math.min(CAPACITY, trail.count + 1);
    });
    for (const id of this.trails.keys()) {
      if (!this.seen.has(id)) this.trails.delete(id);
    }
  }

  /** Each trail takes the colour of its ball. */
  draw(context: CanvasRenderingContext2D, balls: readonly Ball[], nowMs: number): void {
    context.lineCap = 'round';
    for (const ball of balls) {
      const trail = this.trails.get(ball.id);
      context.strokeStyle = findBall(ball.typeId).color;
      if (trail) this.drawTrail(context, trail, ball.radius * 2 * WIDTH_SHARE, nowMs);
    }
    context.globalAlpha = 1;
  }

  /** Segments from newest to oldest, thinner and fainter with age. */
  private drawTrail(
    context: CanvasRenderingContext2D,
    trail: Trail,
    width: number,
    nowMs: number,
  ): void {
    let newer = (trail.next - 1 + CAPACITY) % CAPACITY;
    for (let step = 1; step < trail.count; step++) {
      const older = (newer - 1 + CAPACITY) % CAPACITY;
      const age = nowMs - (trail.points[older * FIELDS + 2] ?? 0);
      if (age > TRAIL_MS) break;
      const fade = 1 - age / TRAIL_MS;
      context.globalAlpha = TRAIL_ALPHA * fade;
      context.lineWidth = width * fade;
      context.beginPath();
      context.moveTo(trail.points[newer * FIELDS] ?? 0, trail.points[newer * FIELDS + 1] ?? 0);
      context.lineTo(trail.points[older * FIELDS] ?? 0, trail.points[older * FIELDS + 1] ?? 0);
      context.stroke();
      newer = older;
    }
  }
}
