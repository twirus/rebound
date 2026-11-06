import { branches } from '../../content/branches';
import { treeNodes } from '../../content/tree';
import { buyNode } from '../../game/session';
import { nodeLevels, resourceAmounts } from '../../game/store';
import { levelOf } from '../../game/state';
import { t } from '../../i18n';
import { ResourceList } from '../ResourceList';
import { selectedNode, treeOpen } from '../uiState';
import { BranchPanel } from './BranchPanel';
import { CARD_WIDTH, COLUMN_GAP, layoutTree } from './layout';
import { viewNode } from './nodeView';
import { TreeCard } from './TreeCard';
import { TreeDetails } from './TreeDetails';

const layout = layoutTree(
  treeNodes,
  branches.map((branch) => branch.id),
);
const totalLevels = treeNodes.reduce((sum, node) => sum + node.maxLevel, 0);

function ColumnHeaders() {
  return (
    <div class="tree-columns" style={{ width: `${layout.width}px` }}>
      {Array.from({ length: layout.columns }, (_, column) => (
        <span
          key={column}
          class="caption dim"
          style={{ left: `${column * (CARD_WIDTH + COLUMN_GAP)}px`, width: `${CARD_WIDTH}px` }}
        >
          {column === 0 ? t('tree.start') : t('tree.step', { step: String(column) })}
        </span>
      ))}
    </div>
  );
}

function TreeCanvas() {
  const levels = nodeLevels.value;
  return (
    <div class="tree-scroll">
      <ColumnHeaders />
      <div class="tree-canvas" style={{ width: `${layout.width}px`, height: `${layout.height}px` }}>
        <svg class="tree-lines" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.edges.map((edge) => (
            <path
              key={`${edge.from}-${edge.to}`}
              d={edge.path}
              class={levelOf(levels, edge.from) > 0 ? 'line-active' : 'line-idle'}
            />
          ))}
        </svg>
        {layout.placements.map((placement) => (
          <TreeCard
            key={placement.node.id}
            placement={placement}
            view={viewNode(placement.node)}
            selected={selectedNode.value === placement.node.id}
            onSelect={() => (selectedNode.value = placement.node.id)}
            onBuy={() => buyNode(placement.node.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function TreeOverlay() {
  const selected = treeNodes.find((node) => node.id === selectedNode.value);
  const boughtLevels = treeNodes.reduce((sum, node) => sum + levelOf(nodeLevels.value, node.id), 0);
  return (
    <section class="tree-overlay" aria-label={t('tree.title')}>
      <header class="top-bar">
        <span class="title">{t('tree.title')}</span>
        <ResourceList amounts={resourceAmounts.value} />
        <span class="spacer" />
        <button class="text-button accent" type="button" onClick={() => (treeOpen.value = false)}>
          {t('tree.close')}
        </button>
      </header>
      <div class="tree-body">
        <BranchPanel />
        <TreeCanvas />
        <TreeDetails view={selected ? viewNode(selected) : null} />
      </div>
      <footer class="bottom-bar">
        <span>
          {t('tree.levelsBought', { bought: String(boughtLevels), total: String(totalLevels) })}
        </span>
        <span class="separator hide-narrow">·</span>
        <span class="hide-narrow">{t('tree.hints')}</span>
      </footer>
    </section>
  );
}
