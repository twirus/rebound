import type { Polygon } from '../sim/shapes/polygon';
import type { RingsState } from '../sim/shapes/rings';
import { findShape, type Arena } from '../sim/world';

const FULL_TURN = Math.PI * 2;

function drawCircle(context: CanvasRenderingContext2D, radius: number): void {
  context.beginPath();
  context.arc(0, 0, radius, 0, FULL_TURN);
  context.stroke();
}

/** Rings are drawn a little bolder so the packed rings read as a solid maze. */
const RING_WIDTH_FACTOR = 1.4;

/** Each whole ring is an arc from one edge of its gap round to the other. */
function drawRings(context: CanvasRenderingContext2D, state: RingsState): void {
  const halfGap = Math.acos(state.gapCos);
  context.lineWidth *= RING_WIDTH_FACTOR;
  for (const ring of state.rings) {
    if (ring.broken) continue;
    const gapAngle = Math.atan2(ring.gapY, ring.gapX);
    context.beginPath();
    context.arc(0, 0, ring.radius, gapAngle + halfGap, gapAngle - halfGap + FULL_TURN);
    context.stroke();
  }
}

/** Portal sides are dashed: dash and gap lengths in world units. */
const PORTAL_DASH = [10, 8];

function drawSide(context: CanvasRenderingContext2D, polygon: Polygon, side: number): void {
  const next = (side + 1) % polygon.sides;
  context.beginPath();
  context.moveTo(polygon.cornersX[side] ?? 0, polygon.cornersY[side] ?? 0);
  context.lineTo(polygon.cornersX[next] ?? 0, polygon.cornersY[next] ?? 0);
  context.stroke();
}

/** Plain sides use the current stroke; the portal side is dashed; coloured sides use `colors`. */
function drawPolygon(
  context: CanvasRenderingContext2D,
  polygon: Polygon,
  portalSide: number,
  colors: readonly string[] = [],
): void {
  const plain = context.strokeStyle;
  for (let side = 0; side < polygon.sides; side++) {
    context.strokeStyle = colors[side % Math.max(1, colors.length)] ?? plain;
    if (side === portalSide) context.setLineDash(PORTAL_DASH);
    drawSide(context, polygon, side);
    if (side === portalSide) context.setLineDash([]);
  }
  context.strokeStyle = plain;
}

/** Stroke style and transform are set by the caller; this only adds the wall paths. */
export function drawShapeWalls(context: CanvasRenderingContext2D, arena: Arena): void {
  const state = arena.shape;
  switch (state.kind) {
    case 'circle':
      drawCircle(context, arena.radius);
      break;
    case 'rings':
      drawRings(context, state);
      break;
    case 'triangle':
      drawPolygon(context, state.polygon, -1);
      break;
    case 'square':
      drawPolygon(context, state.polygon, state.portalSide);
      break;
    case 'hexagon':
      drawPolygon(context, state.polygon, -1, findShape(arena.shapeId).hexagon?.colors);
      break;
  }
}
