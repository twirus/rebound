export type SimEventKind =
  'wall-hit' | 'ball-collision' | 'push' | 'ring-break' | 'escape' | 'round-reset';

export interface SimEvent {
  kind: SimEventKind;
  arenaIndex: number;
  x: number;
  y: number;
  /** Impact speed for hits and collisions, reach for pushes, ring radius for breaks. */
  strength: number;
}

/**
 * Events of the current tick. Objects are reused between ticks so the hot
 * loop does not allocate; read entries 0..count-1 only.
 */
export class SimEventBuffer {
  private readonly items: SimEvent[] = [];
  count = 0;

  push(kind: SimEventKind, arenaIndex: number, x: number, y: number, strength: number): void {
    let event = this.items[this.count];
    if (!event) {
      event = { kind, arenaIndex, x, y, strength };
      this.items.push(event);
    } else {
      event.kind = kind;
      event.arenaIndex = arenaIndex;
      event.x = x;
      event.y = y;
      event.strength = strength;
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
