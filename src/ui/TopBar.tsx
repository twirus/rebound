import { meta } from '../content/meta';
import { resources } from '../content/resources';
import { formatNumber } from '../core/formatNumber';
import { resourceAmounts } from '../game/resources';
import { t } from '../i18n';

export function TopBar() {
  return (
    <header class="top-bar">
      <span class="title">{meta.title}</span>
      {resources.map((resource) => (
        <span class="resource" key={resource.id}>
          <span class="resource-name">{t(resource.nameKey)}</span>
          <span class="resource-amount" style={{ color: resource.color }}>
            {formatNumber(resourceAmounts.value[resource.id] ?? 0)}
          </span>
        </span>
      ))}
    </header>
  );
}
