import type { ShapeDef } from './types';

export const shapes: readonly ShapeDef[] = [
  {
    id: 'shape:circle',
    nameKey: 'shape.circle.name',
    tags: ['hit'],
    resource: 'resource:impulse',
    radius: 200,
  },
];
