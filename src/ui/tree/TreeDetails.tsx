import { branches } from '../../content/branches';
import { stats as statDefs } from '../../content/stats';
import { treeNodes } from '../../content/tree';
import type { NodeCondition, TreeNodeDef } from '../../content/types';
import { conditionMet, findNode, nodeStatus } from '../../game/purchases';
import { levelOf } from '../../game/state';
import { currentStats, nodeLevels } from '../../game/store';
import { buyNode } from '../../game/session';
import { t } from '../../i18n';
import { formatValue } from '../format';
import { selectedNode } from '../uiState';
import { NodeIcon } from './NodeIcon';
import { viewNode, visibleName, type NodeView } from './nodeView';
import { PriceList } from './PriceList';

const STAT_DECIMALS = 2;

function statName(stat: NodeCondition & { kind: 'stat-at-least' }): string {
  const def = statDefs.find((candidate) => candidate.id === stat.stat);
  return def ? t(def.nameKey) : stat.stat;
}

function EffectLines({ node, maxed }: { node: TreeNodeDef; maxed: boolean }) {
  return (
    <ul class="detail-list">
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

function conditionText(condition: NodeCondition): string {
  switch (condition.kind) {
    case 'stat-at-least':
      return t('tree.condition.statAtLeast', {
        stat: statName(condition),
        value: formatValue(condition.value),
      });
    case 'levels-bought':
      return t('tree.condition.levelsBought', { value: formatValue(condition.value) });
    case 'future':
      return t('tree.condition.future');
  }
}

function Conditions({ node }: { node: TreeNodeDef }) {
  const conditions = node.conditions ?? [];
  if (conditions.length === 0) return null;
  return (
    <>
      <span class="caption dim">{t('tree.conditions')}</span>
      <ul class="detail-list">
        {conditions.map((condition, index) => {
          const met = conditionMet(condition, nodeLevels.value, currentStats.value);
          return (
            <li key={index} class={met ? 'ok' : 'mute'}>
              {conditionText(condition)}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Requirements({ node }: { node: TreeNodeDef }) {
  const missing = node.requires.filter((id) => levelOf(nodeLevels.value, id) === 0);
  if (
    missing.length === 0 ||
    (node.requiresMode === 'any' && missing.length < node.requires.length)
  ) {
    return null;
  }
  const names = missing.map((id) => visibleName(viewNode(findNode(id)))).join(', ');
  const key = node.requiresMode === 'any' ? 'tree.requiresAny' : 'tree.requires';
  return <p class="warn-text">{t(key, { names })}</p>;
}

/** Children that are not silhouettes, so the player sees what this node leads to. */
function Unlocks({ node }: { node: TreeNodeDef }) {
  const names = treeNodes
    .filter((child) => child.requires.includes(node.id))
    .filter((child) => nodeStatus(child, nodeLevels.value, currentStats.value) !== 'hidden')
    .map((child) => t(child.nameKey));
  if (names.length === 0) return null;
  return <p class="dim">{t('tree.unlocks', { names: names.join(', ') })}</p>;
}

function BuyArea({ view }: { view: NodeView }) {
  if (view.status === 'maxed') {
    return <span class="caption accent">{t('tree.fullyBought')}</span>;
  }
  return (
    <>
      <PriceList prices={view.prices} affordable={view.affordable} withNames />
      <button
        type="button"
        class="buy-button"
        disabled={!view.affordable}
        onClick={() => buyNode(view.node.id)}
      >
        {t('tree.buy')}
      </button>
    </>
  );
}

function DetailsBody({ view }: { view: NodeView }) {
  const { node, status } = view;
  const branch = branches.find((candidate) => candidate.id === node.branch);
  return (
    <>
      <div class="details-head">
        <NodeIcon icon={node.icon} size={40} />
        <div>
          <span class="caption accent">
            {branch ? t(branch.nameKey) : ''}
            {node.kind === 'key' ? ` · ${t('tree.kind.key')}` : ''}
          </span>
          <h2 class="details-name">{t(node.nameKey)}</h2>
          <span class="caption dim">
            {t('tree.level', { level: String(view.level), max: String(node.maxLevel) })}
          </span>
        </div>
      </div>
      <p class="details-description">{t(node.descriptionKey)}</p>
      <EffectLines node={node} maxed={status === 'maxed'} />
      <Conditions node={node} />
      <Requirements node={node} />
      {status === 'capped' && <p class="warn-text">{t('tree.cappedReason')}</p>}
      <Unlocks node={node} />
      <div class="details-buy">
        <BuyArea view={view} />
      </div>
    </>
  );
}

export function TreeDetails() {
  const node = treeNodes.find((candidate) => candidate.id === selectedNode.value);
  const view = node ? viewNode(node) : null;
  const shown = view !== null && view.status !== 'hidden';
  return (
    <aside class={`tree-details ${shown ? 'open' : ''}`}>
      <button
        type="button"
        class="text-button details-close"
        onClick={() => (selectedNode.value = null)}
      >
        {t('tree.closeDetails')}
      </button>
      {shown ? <DetailsBody view={view} /> : <p class="dim">{t('tree.selectHint')}</p>}
    </aside>
  );
}
