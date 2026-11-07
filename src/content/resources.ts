import type { ResourceDef } from './types';

export const resources: readonly ResourceDef[] = [
  {
    id: 'resource:impulse',
    nameKey: 'resource.impulse.name',
    perSecondKey: 'resource.impulse.perSecond',
    color: '#e8e6e1',
  },
  {
    id: 'resource:shards',
    nameKey: 'resource.shards.name',
    perSecondKey: 'resource.shards.perSecond',
    color: '#7fb2c9',
  },
];
