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
    radius: 359,
    // One small ball working its way out, ring by ring, is the whole show.
    maxBalls: 1,
    ballScale: 0.5,
    rings: {
      count: 30,
      innerRadius: 40,
      spacing: 11,
      gapDegrees: 40,
      degreesPerSecond: 36,
      speedStep: 0.08,
    },
  },
];
