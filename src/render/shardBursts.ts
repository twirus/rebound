import type { World } from '../sim/world';

const BURST_DURATION_MS = 520;
/** Pieces per broken ring, spread evenly round it. */
const PIECES_PER_RING = 18;
const PIECE_SIZE_PX = 2.5;
/** Outward drift over the whole burst, CSS pixels. */
const DRIFT_PX = 22;
const MAX_BURSTS = 24;

interface Burst {
  radius: number;
  /** Rotation of the first piece, so bursts do not all look the same. */
  offset: number;
  startMs: number;
}

/** Small squares that fly off and fade where a ring shattered. Purely visual. */
export class ShardBursts {
  private readonly bursts: Burst[] = [];

  collect(world: World, arenaIndex: number, nowMs: number): void {
    const events = world.events;
    for (let index = 0; index < events.count; index++) {
      const event = events.at(index);
      if (event.kind !== 'ring-break' || event.arenaIndex !== arenaIndex) continue;
      if (this.bursts.length >= MAX_BURSTS) this.bursts.shift();
      this.bursts.push({
        radius: event.strength,
        offset: Math.atan2(event.y, event.x),
        startMs: nowMs,
      });
    }
  }

  /** Draws in arena coordinates; `scale` converts CSS pixels to world units. */
  draw(context: CanvasRenderingContext2D, color: string, scale: number, nowMs: number): void {
    while (this.bursts[0] && nowMs - this.bursts[0].startMs > BURST_DURATION_MS) {
      this.bursts.shift();
    }
    context.fillStyle = color;
    const size = PIECE_SIZE_PX / scale;
    for (const burst of this.bursts) {
      const progress = (nowMs - burst.startMs) / BURST_DURATION_MS;
      const eased = 1 - (1 - progress) * (1 - progress);
      const distance = burst.radius + (DRIFT_PX / scale) * eased;
      context.globalAlpha = 1 - progress;
      for (let piece = 0; piece < PIECES_PER_RING; piece++) {
        const angle = burst.offset + (piece / PIECES_PER_RING) * Math.PI * 2;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        context.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
    context.globalAlpha = 1;
  }
}
