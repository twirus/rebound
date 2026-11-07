import type { ShapeDef } from './types';

export const shapes: readonly ShapeDef[] = [
  {
    id: 'shape:circle',
    kind: 'circle',
    nameKey: 'shape.circle.name',
    descriptionKey: 'shape.circle.description',
    tags: ['hit'],
    resource: 'resource:impulse',
    radius: 200,
  },
  {
    id: 'shape:rings',
    kind: 'rings',
    nameKey: 'shape.rings.name',
    descriptionKey: 'shape.rings.description',
    tags: ['break', 'escape'],
    resource: 'resource:shards',
    // Outermost ring: innerRadius + spacing × (count − 1); upgrades add rings outward.
    radius: 227,
    // One small ball working its way out, ring by ring, is the whole show.
    maxBalls: 1,
    ballScale: 0.75,
    rings: {
      // Closer than the ball is wide: broken rings stay gone for the round, so the
      // ball only ever sits inside the innermost whole ring, never between two.
      count: 34,
      innerRadius: 29,
      spacing: 6,
      gapDegrees: 40,
      degreesPerSecond: 30,
      speedStep: 0.025,
    },
  },
  {
    id: 'shape:triangle',
    kind: 'triangle',
    nameKey: 'shape.triangle.name',
    descriptionKey: 'shape.triangle.description',
    tags: ['corner', 'split'],
    resource: 'resource:impulse',
    radius: 240,
    polygon: { sides: 3, rotationDegrees: -90 },
    triangle: { cornerShare: 0.2, cloneSeconds: 4, maxClones: 12 },
  },
  {
    id: 'shape:square',
    kind: 'square',
    nameKey: 'shape.square.name',
    descriptionKey: 'shape.square.description',
    tags: ['portal', 'link'],
    resource: 'resource:impulse',
    radius: 220,
    polygon: { sides: 4, rotationDegrees: -135 },
    square: { hitsPerShift: 8 },
  },
  {
    id: 'shape:hexagon',
    kind: 'hexagon',
    nameKey: 'shape.hexagon.name',
    descriptionKey: 'shape.hexagon.description',
    tags: ['color'],
    resource: 'resource:spectrum',
    radius: 210,
    polygon: { sides: 6, rotationDegrees: -90 },
    hexagon: {
      // Sides take these in turn, so opposite sides share a colour.
      colors: ['#c96a6a', '#7fc98f', '#7fa7c9'],
      comboLength: 3,
    },
  },
];
