import { signal } from '@preact/signals';
import { resources } from '../content/resources';
import type { ResourceId } from '../content/types';

type ResourceTable = Readonly<Record<ResourceId, number>>;

function zeroTable(): ResourceTable {
  return Object.fromEntries(resources.map((resource) => [resource.id, 0]));
}

export const resourceAmounts = signal<ResourceTable>(zeroTable());
export const incomePerSecond = signal<ResourceTable>(zeroTable());
