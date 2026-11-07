import { resources } from '../content/resources';
import type { ResourceTable } from '../game/state';
import { shownResources } from '../game/store';
import { t } from '../i18n';
import { formatValue } from './format';

interface ResourceListProps {
  amounts: ResourceTable;
}

export function ResourceList({ amounts }: ResourceListProps) {
  const shown = shownResources.value;
  return (
    <>
      {resources
        .filter((resource) => shown.includes(resource.id))
        .map((resource) => (
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
