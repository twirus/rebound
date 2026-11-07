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
    radius: 292,
    rings: {
      count: 12,
      innerRadius: 50,
      spacing: 22,
      gapDegrees: 40,
      degreesPerSecond: 36,
      speedStep: 0.08,
      regrowSeconds: 8,
    },
  },
];
