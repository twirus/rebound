import { panBy, zoomAt } from './camera';

/** Movement in pixels after which a press becomes a drag instead of a click. */
const DRAG_THRESHOLD = 5;
const WHEEL_ZOOM_SPEED = 0.0015;

interface Point {
  x: number;
  y: number;
}

function distance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function midpoint(first: Point, second: Point): Point {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

/**
 * Wheel zooms to the cursor, one pointer drags, two pointers pinch.
 * A press that turned into a drag swallows the following click so no card gets selected.
 */
class CameraControls {
  private readonly pointers = new Map<number, Point>();
  private pressStart: Point | null = null;
  private dragging = false;

  constructor(private readonly viewport: HTMLElement) {}

  private local(event: MouseEvent): Point {
    const rect = this.viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  readonly onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const point = this.local(event);
    zoomAt(point.x, point.y, Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED));
  };

  readonly onPointerDown = (event: PointerEvent) => {
    this.pointers.set(event.pointerId, this.local(event));
    if (this.pointers.size === 1) {
      this.pressStart = this.local(event);
      this.dragging = false;
    }
  };

  readonly onPointerMove = (event: PointerEvent) => {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    const current = this.local(event);
    if (this.pointers.size >= 2) {
      this.pinch(event.pointerId, current);
      return;
    }
    this.pointers.set(event.pointerId, current);
    if (!this.dragging && this.pressStart && distance(this.pressStart, current) > DRAG_THRESHOLD) {
      this.dragging = true;
      this.viewport.setPointerCapture(event.pointerId);
    }
    if (this.dragging) panBy(current.x - previous.x, current.y - previous.y);
  };

  readonly onPointerUp = (event: PointerEvent) => {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size === 0) this.pressStart = null;
  };

  readonly onClickCapture = (event: MouseEvent) => {
    if (!this.dragging) return;
    event.stopPropagation();
    event.preventDefault();
    this.dragging = false;
  };

  readonly onContextMenu = (event: MouseEvent) => event.preventDefault();

  /** Pans by the movement of the midpoint and zooms by the change in finger distance. */
  private pinch(pointerId: number, current: Point): void {
    const [first, second] = [...this.pointers.values()];
    if (!first || !second) return;
    const before = { gap: distance(first, second), centre: midpoint(first, second) };
    this.pointers.set(pointerId, current);
    const [nextFirst, nextSecond] = [...this.pointers.values()];
    if (!nextFirst || !nextSecond) return;
    const centre = midpoint(nextFirst, nextSecond);
    panBy(centre.x - before.centre.x, centre.y - before.centre.y);
    if (before.gap > 0) zoomAt(centre.x, centre.y, distance(nextFirst, nextSecond) / before.gap);
    this.dragging = true;
  }
}

export function attachCameraControls(viewport: HTMLElement): () => void {
  const controls = new CameraControls(viewport);
  const listeners: [string, EventListener, AddEventListenerOptions][] = [
    ['wheel', controls.onWheel as EventListener, { passive: false }],
    ['pointerdown', controls.onPointerDown as EventListener, {}],
    ['pointermove', controls.onPointerMove as EventListener, {}],
    ['pointerup', controls.onPointerUp as EventListener, {}],
    ['pointercancel', controls.onPointerUp as EventListener, {}],
    ['click', controls.onClickCapture as EventListener, { capture: true }],
    ['dblclick', controls.onClickCapture as EventListener, { capture: true }],
    ['contextmenu', controls.onContextMenu as EventListener, {}],
  ];
  for (const [type, listener, options] of listeners) {
    viewport.addEventListener(type, listener, options);
  }
  return () => {
    for (const [type, listener, options] of listeners) {
      viewport.removeEventListener(type, listener, options);
    }
  };
}
