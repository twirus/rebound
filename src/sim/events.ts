import type { BallId, SimEventKind } from '../content/types';
import type { Ball } from './world';

export type { SimEventKind } from '../content/types';

export interface SimEvent {
  kind: SimEventKind;
  arenaIndex: number;
  x: number;
  y: number;
  /** Impact speed for hits and collisions, reach for pushes, ring radius for breaks. */
  strength: number;
  /** The ball that caused the event, −1 and null when no single ball did. */
  ballId: number;
  ballType: BallId | null;
  /** 0 for things that just happened; n for the n-th link of a gem chain. */
  depth: number;
  /** Index of the arena scheme whose effect caused the event, −1 for none. */
  scheme: number;
}

/**
 * Events of the current tick. Objects are reused between ticks so the hot
 * loop does not allocate; read entries 0..count-1 only.
 */
export class SimEventBuffer {
  private readonly items: SimEvent[] = [];
  count = 0;
  /** Chain depth and scheme stamped on events pushed while a gem effect runs. */
  depth = 0;
  scheme = -1;

  push(
    kind: SimEventKind,
    arenaIndex: number,
    x: number,
    y: number,
    strength: number,
    ball: Ball | null = null,
  ): void {
    let event = this.items[this.count];
    if (!event) {
      event = {
        kind,
        arenaIndex,
        x,
        y,
        strength,
        ballId: -1,
        ballType: null,
        depth: 0,
        scheme: -1,
      };
      this.items.push(event);
    }
    event.kind = kind;
    event.arenaIndex = arenaIndex;
    event.x = x;
    event.y = y;
    event.strength = strength;
    event.ballId = ball ? ball.id : -1;
    event.ballType = ball ? ball.typeId : null;
    event.depth = this.depth;
    event.scheme = this.scheme;
    this.count += 1;
  }

  at(index: number): SimEvent {
    const event = this.items[index];
    if (!event || index >= this.count) throw new Error(`No event at ${index}`);
    return event;
  }

  clear(): void {
    this.count = 0;
    this.depth = 0;
    this.scheme = -1;
  }
}
