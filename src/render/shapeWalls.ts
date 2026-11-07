import type { RingsState } from '../sim/shapes/rings';
import type { Arena } from '../sim/world';

const FULL_TURN = Math.PI * 2;

function drawCircle(context: CanvasRenderingContext2D, radius: number): void {
  context.beginPath();
  context.arc(0, 0, radius, 0, FULL_TURN);
  context.stroke();
}

/** Each whole ring is an arc from one edge of its gap round to the other. */
function drawRings(context: CanvasRenderingContext2D, state: RingsState): void {
  const halfGap = Math.acos(state.gapCos);
  for (const ring of state.rings) {
    if (ring.broken) continue;
    const gapAngle = Math.atan2(ring.gapY, ring.gapX);
    context.beginPath();
    context.arc(0, 0, ring.radius, gapAngle + halfGap, gapAngle - halfGap + FULL_TURN);
    context.stroke();
  }
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
  }
}
