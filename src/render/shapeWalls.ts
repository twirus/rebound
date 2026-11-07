import type { Polygon } from '../sim/shapes/polygon';
import type { MosaicState } from '../sim/shapes/mosaic';
import type { RingsState } from '../sim/shapes/rings';
import type { SpiralState } from '../sim/shapes/spiral';
import type { StarState } from '../sim/shapes/star';
import type { MosaicTileType } from '../content/types';
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

/** Spring tiles in amber, rich tiles in the Shards colour; plain tiles use the wall colour. */
const TILE_COLORS: Readonly<Partial<Record<MosaicTileType, string>>> = {
  spring: '#e0a040',
  rich: '#7fb2c9',
};
/** Worn tiles fade towards this opacity. */
const WORN_TILE_ALPHA = 0.3;
/** Share of each tile's angle left empty between neighbours. */
const TILE_GAP_SHARE = 0.12;
/** Star rays stick out this share of the radius beyond the wall. */
const RAY_LENGTH_SHARE = 0.16;

function drawMosaic(context: CanvasRenderingContext2D, state: MosaicState, radius: number): void {
  const plain = context.strokeStyle;
  const baseAlpha = context.globalAlpha;
  const step = FULL_TURN / state.tiles.length;
  state.tiles.forEach((tile, index) => {
    if (tile.hitsLeft <= 0) return;
    const wear = tile.hitsLeft / state.durability;
    context.globalAlpha = baseAlpha * (WORN_TILE_ALPHA + (1 - WORN_TILE_ALPHA) * wear);
    context.strokeStyle = TILE_COLORS[tile.type] ?? plain;
    const start = -Math.PI + step * index + (step * TILE_GAP_SHARE) / 2;
    context.beginPath();
    context.arc(0, 0, radius, start, start + step * (1 - TILE_GAP_SHARE));
    context.stroke();
  });
  context.globalAlpha = baseAlpha;
  context.strokeStyle = plain;
}

function drawSpiral(context: CanvasRenderingContext2D, state: SpiralState, radius: number): void {
  drawCircle(context, radius);
  context.beginPath();
  context.arc(0, 0, state.coreRadius, 0, FULL_TURN);
  context.stroke();
}

/** The wall between rays, and each ray as a spike pointing out. */
function drawStar(context: CanvasRenderingContext2D, state: StarState, radius: number): void {
  const halfRay = Math.acos(state.rayCos);
  const tip = radius * (1 + RAY_LENGTH_SHARE);
  state.raysX.forEach((rayX, ray) => {
    const angle = Math.atan2(state.raysY[ray] ?? 0, rayX);
    const nextAngle = Math.atan2(
      state.raysY[(ray + 1) % state.raysX.length] ?? 0,
      state.raysX[(ray + 1) % state.raysX.length] ?? 0,
    );
    const arcEnd = nextAngle - halfRay + (nextAngle < angle ? FULL_TURN : 0);
    context.beginPath();
    context.arc(0, 0, radius, angle + halfRay, arcEnd);
    context.stroke();
    context.beginPath();
    context.moveTo(Math.cos(angle - halfRay) * radius, Math.sin(angle - halfRay) * radius);
    context.lineTo(rayX * tip, (state.raysY[ray] ?? 0) * tip);
    context.lineTo(Math.cos(angle + halfRay) * radius, Math.sin(angle + halfRay) * radius);
    context.stroke();
  });
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
    case 'mosaic':
      drawMosaic(context, state, arena.radius);
      break;
    case 'spiral':
      drawSpiral(context, state, arena.radius);
      break;
    case 'star':
      drawStar(context, state, arena.radius);
      break;
  }
}
