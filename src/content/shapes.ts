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
];
