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
    radius: 200,
    rings: {
      count: 4,
      innerShare: 0.4,
      gapDegrees: 36,
      degreesPerSecond: 40,
      speedStep: 0.18,
      regrowSeconds: 8,
    },
  },
];
