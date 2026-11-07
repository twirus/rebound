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
  {
    id: 'resource:spectrum',
    nameKey: 'resource.spectrum.name',
    perSecondKey: 'resource.spectrum.perSecond',
    color: '#b59ad1',
  },
  {
    id: 'resource:mass',
    nameKey: 'resource.mass.name',
    perSecondKey: 'resource.mass.perSecond',
    color: '#c98f6a',
  },
  {
    id: 'resource:chronos',
    nameKey: 'resource.chronos.name',
    perSecondKey: 'resource.chronos.perSecond',
    color: '#d4c36a',
  },
];
