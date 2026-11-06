import type { World } from '../sim/world';

const RING_DURATION_MS = 260;
/** Ring starts at this share of the push reach and grows to the full reach. */
const RING_START = 0.25;
const RING_ALPHA = 0.5;
const RING_WIDTH_PX = 1.5;
const MAX_RINGS = 16;
const FULL_TURN = Math.PI * 2;

interface Ring {
  x: number;
  y: number;
  reach: number;
  startMs: number;
}

/** Short expanding outline where a push happened. Purely visual. */
export class PushRings {
  private readonly rings: Ring[] = [];

  collect(world: World, arenaIndex: number, nowMs: number): void {
    const events = world.events;
    for (let index = 0; index < events.count; index++) {
      const event = events.at(index);
      if (event.kind !== 'push' || event.arenaIndex !== arenaIndex) continue;
      if (this.rings.length >= MAX_RINGS) this.rings.shift();
      this.rings.push({ x: event.x, y: event.y, reach: event.strength, startMs: nowMs });
    }
  }

  /** Draws in arena coordinates; `scale` converts CSS pixels to world units. */
  draw(context: CanvasRenderingContext2D, color: string, scale: number, nowMs: number): void {
    while (this.rings[0] && nowMs - this.rings[0].startMs > RING_DURATION_MS) this.rings.shift();
    context.strokeStyle = color;
    context.lineWidth = RING_WIDTH_PX / scale;
    for (const ring of this.rings) {
      const progress = (nowMs - ring.startMs) / RING_DURATION_MS;
      const eased = 1 - (1 - progress) * (1 - progress);
      context.globalAlpha = RING_ALPHA * (1 - progress);
      context.beginPath();
      context.arc(
        ring.x,
        ring.y,
        ring.reach * (RING_START + (1 - RING_START) * eased),
        0,
        FULL_TURN,
      );
      context.stroke();
    }
    context.globalAlpha = 1;
  }
}
