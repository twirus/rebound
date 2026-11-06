import { resources } from '../content/resources';
import { formatNumber } from '../core/formatNumber';
import { incomePerSecond } from '../game/resources';
import { t } from '../i18n';

export function BottomBar() {
  return (
    <footer class="bottom-bar">
      {resources.map((resource) => (
        <span key={resource.id}>
          {t(resource.perSecondKey, {
            value: formatNumber(incomePerSecond.value[resource.id] ?? 0),
          })}
        </span>
      ))}
    </footer>
  );
}
