import type { BallId } from '../content/types';
import type { Ball } from './world';
export type SimEventKind =
  | 'wall-hit'
  | 'ball-collision'
  | 'push'
  | 'ring-break'
  | 'escape'
  | 'round-reset'
  | 'corner-hit'
  | 'split'
  | 'portal'
  | 'combo'
  | 'tile-break'
  | 'core-reach'
  | 'merge'
  | 'launch'
  | 'unstick'
  | 'vanish'
  | 'hatch';

export interface SimEvent {
  kind: SimEventKind;
  arenaIndex: number;
  x: number;
  y: number;
  /** Impact speed for hits and collisions, reach for pushes, ring radius for breaks. */
  strength: number;
  /** Type of the ball that caused the event, null when no single ball did. */
  ballType: BallId | null;
}

/**
 * Events of the current tick. Objects are reused between ticks so the hot
 * loop does not allocate; read entries 0..count-1 only.
 */
export class SimEventBuffer {
  private readonly items: SimEvent[] = [];
  count = 0;

  push(
    kind: SimEventKind,
    arenaIndex: number,
    x: number,
    y: number,
    strength: number,
    ball: Ball | null = null,
  ): void {
    const ballType = ball ? ball.typeId : null;
    let event = this.items[this.count];
    if (!event) {
      event = { kind, arenaIndex, x, y, strength, ballType };
      this.items.push(event);
    } else {
      event.kind = kind;
      event.arenaIndex = arenaIndex;
      event.x = x;
      event.y = y;
      event.strength = strength;
      event.ballType = ballType;
    }
    this.count += 1;
  }

  at(index: number): SimEvent {
    const event = this.items[index];
    if (!event || index >= this.count) throw new Error(`No event at ${index}`);
    return event;
  }

  clear(): void {
    this.count = 0;
  }
}
