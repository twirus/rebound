import { resources } from '../content/resources';
import { incomePerSecond, tapCooldownLeft } from '../game/store';
import { t } from '../i18n';
import { formatValue } from './format';

export function BottomBar() {
  const cooldown = tapCooldownLeft.value;
  return (
    <footer class="bottom-bar">
      {resources.map((resource) => (
        <span key={resource.id} class="income">
          {t(resource.perSecondKey, {
            value: formatValue(incomePerSecond.value[resource.id] ?? 0, 1),
          })}
        </span>
      ))}
      <span class="separator">·</span>
      <span class={cooldown > 0 ? 'mute' : undefined}>
        {cooldown > 0
          ? t('hud.tapCooldown', { seconds: formatValue(cooldown, 1) })
          : t('hud.tapReady')}
      </span>
      <span class="separator hide-narrow">·</span>
      <span class="hide-narrow">{t('hud.treeHint')}</span>
    </footer>
  );
}
