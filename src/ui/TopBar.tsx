import { meta } from '../content/meta';
import { resourceAmounts } from '../game/store';
import { t } from '../i18n';
import { ResourceList } from './ResourceList';
import { soundEnabled } from './settings';
import { treeOpen, workshopOpen } from './uiState';

export function TopBar() {
  return (
    <header class="top-bar">
      <span class="title">{meta.title}</span>
      <ResourceList amounts={resourceAmounts.value} />
      <span class="spacer" />
      <button
        class="text-button"
        type="button"
        aria-pressed={soundEnabled.value}
        onClick={() => (soundEnabled.value = !soundEnabled.value)}
      >
        {t(soundEnabled.value ? 'hud.soundOn' : 'hud.soundOff')}
      </button>
      <button class="text-button" type="button" onClick={() => (workshopOpen.value = true)}>
        {t('workshop.title')}
      </button>
      <button class="text-button accent" type="button" onClick={() => (treeOpen.value = true)}>
        {t('hud.tree')}
      </button>
    </header>
  );
}
