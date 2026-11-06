import { resources } from '../content/resources';
import type { ResourceTable } from '../game/state';
import { t } from '../i18n';
import { formatValue } from './format';

interface ResourceListProps {
  amounts: ResourceTable;
}

export function ResourceList({ amounts }: ResourceListProps) {
  return (
    <>
      {resources.map((resource) => (
        <span class="resource" key={resource.id}>
          <span class="caption">{t(resource.nameKey)}</span>
          <span class="resource-amount" style={{ color: resource.color }}>
            {formatValue(amounts[resource.id] ?? 0)}
          </span>
        </span>
      ))}
    </>
  );
}
