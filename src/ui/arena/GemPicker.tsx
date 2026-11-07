import { signal } from '@preact/signals';
import type { GemDef, Tag } from '../../content/types';
import { accepts, gemAt, ownedGems, placedGems, type GemSlotRef } from '../../game/gemRules';
import { clearGemSlot, placeGemInSlot } from '../../game/session';
import { arenaSetup, currentStats, nodeLevels } from '../../game/store';
import { t } from '../../i18n';
import { openGemSlot } from '../uiState';

const tagFilter = signal<Tag | null>(null);
const problem = signal<string | null>(null);

/** Where a gem already sits, for the "in scheme 2" mark. */
function placeOf(gem: GemDef): string | null {
  const setup = arenaSetup.value;
  if (!placedGems(setup, currentStats.value).includes(gem.id)) return null;
  if (setup.law === gem.id) return t('gems.inLaw');
  const index = setup.schemes.findIndex(
    (scheme) =>
      scheme.event === gem.id || scheme.effect === gem.id || scheme.supports.includes(gem.id),
  );
  return t('gems.inScheme', { number: String(index + 1) });
}

function pick(slot: GemSlotRef, gem: GemDef): void {
  const result = placeGemInSlot(slot, gem.id);
  if (result) {
    problem.value = t(`gems.problem.${result}`);
    return;
  }
  problem.value = null;
  openGemSlot.value = null;
}

function GemOption({ slot, gem }: { slot: GemSlotRef; gem: GemDef }) {
  const place = placeOf(gem);
  return (
    <button type="button" class="gem-option" onClick={() => pick(slot, gem)}>
      <span class="gem-option-head">
        <span>{t(gem.nameKey)}</span>
        <span class="dim">
          {place ? `${place} · ` : ''}
          {t('gems.load', { load: String(gem.load) })}
        </span>
      </span>
      <span class="gem-option-note">{t(gem.descriptionKey)}</span>
      {gem.kind === 'support' && (
        <span class="gem-option-note warn-text">{t(gem.downsideKey)}</span>
      )}
    </button>
  );
}

/** List of owned gems that fit the open slot, filtered by tag. */
export function GemPicker({ slot }: { slot: GemSlotRef }) {
  const fitting = ownedGems(nodeLevels.value).filter((gem) => accepts(slot, gem));
  const tags = [...new Set(fitting.flatMap((gem) => gem.tags))];
  const filter = tagFilter.value;
  const shown = fitting.filter((gem) => !filter || gem.tags.includes(filter));
  return (
    <div class="gem-picker">
      <div class="workshop-chips">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            class={`workshop-chip ${tag === filter ? 'selected' : ''}`}
            onClick={() => (tagFilter.value = tag === filter ? null : tag)}
          >
            {t(`tag.${tag}`)}
          </button>
        ))}
      </div>
      {problem.value && <p class="warn-text">{problem.value}</p>}
      {shown.map((gem) => (
        <GemOption key={gem.id} slot={slot} gem={gem} />
      ))}
      {shown.length === 0 && <p class="mute">{t('gems.noneFit')}</p>}
      <div class="gem-picker-actions">
        {gemAt(arenaSetup.value, slot) && (
          <button type="button" class="text-button" onClick={() => clearGemSlot(slot)}>
            {t('gems.remove')}
          </button>
        )}
        <button type="button" class="text-button" onClick={() => (openGemSlot.value = null)}>
          {t('tree.closeDetails')}
        </button>
      </div>
    </div>
  );
}
