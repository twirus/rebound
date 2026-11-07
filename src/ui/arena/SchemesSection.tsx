import { gemAt, loadUsed, type GemSlotRef } from '../../game/gemRules';
import { arenaSetup, currentStats, schemeRates } from '../../game/store';
import { findGemDef } from '../../game/gemRules';
import { t } from '../../i18n';
import { formatValue } from '../format';
import { openGemSlot } from '../uiState';
import { GemPicker } from './GemPicker';

/** Rows shown in total: the open ones plus one locked row as a teaser. */
const MAX_SCHEME_ROWS = 5;

function sameSlot(first: GemSlotRef | null, second: GemSlotRef): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function GemSlotButton({ slot }: { slot: GemSlotRef }) {
  const gemId = gemAt(arenaSetup.value, slot);
  const open = sameSlot(openGemSlot.value, slot);
  return (
    <button
      type="button"
      class={`gem-slot ${gemId ? 'filled' : 'empty'} ${open ? 'open' : ''}`}
      onClick={() => (openGemSlot.value = open ? null : slot)}
    >
      {gemId ? t(findGemDef(gemId).nameKey) : t(`gems.slot.${slot.part}`)}
    </button>
  );
}

function SchemeRow({ index }: { index: number }) {
  const supports = currentStats.value['stat:support-slots'];
  const rate = schemeRates.value[index];
  return (
    <div class="scheme-row">
      <span class="caption dim">{index + 1}</span>
      <GemSlotButton slot={{ part: 'event', scheme: index }} />
      <span class="dim">→</span>
      <GemSlotButton slot={{ part: 'effect', scheme: index }} />
      {supports > 0 && <span class="dim">+</span>}
      {Array.from({ length: supports }, (_, support) => (
        <GemSlotButton key={support} slot={{ part: 'support', scheme: index, index: support }} />
      ))}
      {rate !== undefined && (
        <span class="scheme-rate dim">{t('gems.perMinute', { count: formatValue(rate) })}</span>
      )}
    </div>
  );
}

function LoadBar() {
  const used = loadUsed(arenaSetup.value, currentStats.value);
  const capacity = currentStats.value['stat:gem-load'];
  return (
    <div class="load-bar">
      <span class="caption dim">
        {t('gems.loadTotal', { used: String(used), capacity: String(capacity) })}
      </span>
      <span class="load-track">
        <span class="load-fill" style={{ width: `${Math.min(100, (used / capacity) * 100)}%` }} />
      </span>
    </div>
  );
}

/** Law slot and scheme rows of the arena; a picker opens under the slot being filled. */
export function SchemesSection() {
  const stats = currentStats.value;
  const rows = stats['stat:scheme-slots'];
  if (rows === 0) return <p class="mute arena-panel-hint">{t('gems.lockedHint')}</p>;
  const open = openGemSlot.value;
  return (
    <section class="schemes">
      <LoadBar />
      {stats['stat:law-slots'] > 0 && (
        <>
          <span class="caption dim">{t('gems.law')}</span>
          <GemSlotButton slot={{ part: 'law' }} />
          {open?.part === 'law' && <GemPicker slot={open} />}
        </>
      )}
      <span class="caption dim">{t('gems.schemes')}</span>
      {Array.from({ length: Math.min(rows, MAX_SCHEME_ROWS) }, (_, index) => (
        <div key={index}>
          <SchemeRow index={index} />
          {open && open.part !== 'law' && open.scheme === index && <GemPicker slot={open} />}
        </div>
      ))}
      {rows < MAX_SCHEME_ROWS && (
        <div class="scheme-row locked">
          <span class="caption dim">{rows + 1}</span>
          <span class="caption mute">{t('tree.status.locked')}</span>
        </div>
      )}
    </section>
  );
}
