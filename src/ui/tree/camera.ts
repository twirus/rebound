import { effect, signal } from '@preact/signals';

const CAMERA_KEY = 'rebound.treeCamera';
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 1.6;
/** Space kept between the viewport edge and content brought into view. */
const FOCUS_MARGIN = 32;

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

const DEFAULT_CAMERA: Camera = { x: FOCUS_MARGIN, y: FOCUS_MARGIN, scale: 1 };

function isCamera(value: unknown): value is Camera {
  if (typeof value !== 'object' || value === null) return false;
  const fields = value as Record<string, unknown>;
  return ['x', 'y', 'scale'].every((key) => Number.isFinite(fields[key]));
}

function loadCamera(): Camera {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CAMERA_KEY) ?? 'null');
    return isCamera(parsed) ? parsed : DEFAULT_CAMERA;
  } catch (error) {
    console.error('Tree camera could not be read; using the default view', error);
    return DEFAULT_CAMERA;
  }
}

/** Screen position of the tree origin and zoom; kept between openings and reloads. */
export const camera = signal<Camera>(loadCamera());

effect(() => {
  try {
    window.localStorage.setItem(CAMERA_KEY, JSON.stringify(camera.value));
  } catch (error) {
    console.error('Tree camera could not be saved', error);
  }
});

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Zooms keeping the point (screenX, screenY) of the viewport still. */
export function zoomAt(screenX: number, screenY: number, factor: number): void {
  const { x, y, scale } = camera.value;
  const next = clampScale(scale * factor);
  const ratio = next / scale;
  camera.value = {
    x: screenX - (screenX - x) * ratio,
    y: screenY - (screenY - y) * ratio,
    scale: next,
  };
}

export function panBy(dx: number, dy: number): void {
  const { x, y, scale } = camera.value;
  camera.value = { x: x + dx, y: y + dy, scale };
}

/** Puts the tree point (treeX, treeY) at the top-left of the viewport, with a margin. */
export function bringToTopLeft(treeX: number, treeY: number): void {
  const { scale } = camera.value;
  camera.value = { x: FOCUS_MARGIN - treeX * scale, y: FOCUS_MARGIN - treeY * scale, scale };
}

/** Centres the tree point (treeX, treeY) in a viewport of the given size. */
export function centreOn(treeX: number, treeY: number, width: number, height: number): void {
  const { scale } = camera.value;
  camera.value = { x: width / 2 - treeX * scale, y: height / 2 - treeY * scale, scale };
}
