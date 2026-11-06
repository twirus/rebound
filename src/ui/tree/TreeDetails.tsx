import { branches } from '../../content/branches';
import { stats as statDefs } from '../../content/stats';
import type { TreeNodeDef } from '../../content/types';
import { findNode } from '../../game/purchases';
import { levelOf } from '../../game/state';
import { currentStats, nodeLevels } from '../../game/store';
import { buyNode } from '../../game/session';
import { t } from '../../i18n';
import { formatValue } from '../format';
import type { NodeView } from './nodeView';
import { PriceList } from './PriceList';

const STAT_DECIMALS = 2;

function EffectLines({ node, maxed }: { node: TreeNodeDef; maxed: boolean }) {
  return (
    <ul class="effect-list">
      {node.effects.map((effect) => {
        const def = statDefs.find((candidate) => candidate.id === effect.stat);
        const current = currentStats.value[effect.stat];
        return (
          <li key={effect.stat}>
            <span class="dim">{def ? t(def.nameKey) : effect.stat}</span>
            <span>
              {formatValue(current, STAT_DECIMALS)}
              {maxed ? '' : ` → ${formatValue(current + effect.add, STAT_DECIMALS)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function missingRequirements(node: TreeNodeDef): string {
  return node.requires
    .filter((id) => levelOf(nodeLevels.value, id) === 0)
    .map((id) => t(findNode(id).nameKey))
    .join(', ');
}

export function TreeDetails({ view }: { view: NodeView | null }) {
  if (!view || view.status === 'hidden') {
    return <aside class="tree-details dim">{t('tree.selectHint')}</aside>;
  }
  const { node, status } = view;
  const branch = branches.find((candidate) => candidate.id === node.branch);
  const maxed = status === 'maxed';
  return (
    <aside class="tree-details">
      <span class="caption accent">{branch ? t(branch.nameKey) : ''}</span>
      <h2 class="details-name">{t(node.nameKey)}</h2>
      <span class="caption dim">
        {t('tree.level', { level: String(view.level), max: String(node.maxLevel) })}
      </span>
      <p class="details-description">{t(node.descriptionKey)}</p>
      <EffectLines node={node} maxed={maxed} />
      {status === 'locked' && (
        <p class="warn-text">{t('tree.requires', { names: missingRequirements(node) })}</p>
      )}
      {status === 'capped' && <p class="warn-text">{t('tree.cappedReason')}</p>}
      <div class="details-buy">
        {maxed ? (
          <span class="caption accent">{t('tree.fullyBought')}</span>
        ) : (
          <>
            <PriceList prices={view.prices} affordable={view.affordable} withNames />
            <button
              type="button"
              class="buy-button"
              disabled={!view.affordable}
              onClick={() => buyNode(node.id)}
            >
              {t('tree.buy')}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
