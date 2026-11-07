import { detCos, detSin } from '../../core/detMath';
import type { PolygonParams } from '../../content/types';
import type { Ball } from '../world';
import { kickToMinSpeed } from './walls';

const DEGREES_TO_RADIANS = Math.PI / 180;

/** Regular convex polygon around the origin. Side i runs from corner i to corner i + 1. */
export interface Polygon {
  sides: number;
  cornersX: number[];
  cornersY: number[];
  /** Outward unit normal of each side. */
  normalsX: number[];
  normalsY: number[];
  /** Distance from the centre to every side. */
  apothem: number;
  sideLength: number;
}

/** Filled in by `collideSide` when a ball hits a side. Reused, never stored. */
export interface SideContact {
  /** Where the ball touched the wall. */
  x: number;
  y: number;
  /** Position along the side, 0 at its first corner and 1 at the next. */
  along: number;
  speed: number;
}

export function createPolygon(params: PolygonParams, radius: number): Polygon {
  const sides = params.sides;
  const start = params.rotationDegrees * DEGREES_TO_RADIANS;
  const step = (Math.PI * 2) / sides;
  const polygon: Polygon = {
    sides,
    cornersX: [],
    cornersY: [],
    normalsX: [],
    normalsY: [],
    apothem: radius * detCos(step / 2),
    sideLength: 2 * radius * detSin(step / 2),
  };
  for (let side = 0; side < sides; side++) {
    polygon.cornersX.push(radius * detCos(start + step * side));
    polygon.cornersY.push(radius * detSin(start + step * side));
    polygon.normalsX.push(detCos(start + step * (side + 0.5)));
    polygon.normalsY.push(detSin(start + step * (side + 0.5)));
  }
  return polygon;
}

/** Signed distance of a point beyond the side's line; negative means inside. */
export function beyondSide(polygon: Polygon, side: number, x: number, y: number): number {
  return x * (polygon.normalsX[side] ?? 0) + y * (polygon.normalsY[side] ?? 0) - polygon.apothem;
}

/**
 * Keeps the ball inside one side and bounces it. Returns true and fills
 * `contact` only for a real impact (the ball was moving into the wall).
 */
export function collideSide(
  polygon: Polygon,
  side: number,
  ball: Ball,
  minBounceSpeed: number,
  contact: SideContact,
): boolean {
  const normalX = polygon.normalsX[side] ?? 0;
  const normalY = polygon.normalsY[side] ?? 0;
  const overlap = beyondSide(polygon, side, ball.x, ball.y) + ball.radius;
  if (overlap <= 0) return false;
  ball.x -= overlap * normalX;
  ball.y -= overlap * normalY;
  const towardWall = ball.vx * normalX + ball.vy * normalY;
  if (towardWall <= 0) return false;
  ball.vx -= 2 * towardWall * normalX;
  ball.vy -= 2 * towardWall * normalY;
  kickToMinSpeed(ball, minBounceSpeed);
  contact.x = ball.x + normalX * ball.radius;
  contact.y = ball.y + normalY * ball.radius;
  const startX = polygon.cornersX[side] ?? 0;
  const startY = polygon.cornersY[side] ?? 0;
  const next = (side + 1) % polygon.sides;
  const directionX = ((polygon.cornersX[next] ?? 0) - startX) / polygon.sideLength;
  const directionY = ((polygon.cornersY[next] ?? 0) - startY) / polygon.sideLength;
  contact.along =
    ((contact.x - startX) * directionX + (contact.y - startY) * directionY) / polygon.sideLength;
  contact.speed = towardWall;
  return true;
}
