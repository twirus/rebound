import { branches } from '../../content/branches';
import { buyNode } from '../../game/session';
import { t } from '../../i18n';
import { selectedNode } from '../uiState';
import type { Placement } from './layout';
import { NodeIcon } from './NodeIcon';
import { isDimmedBySearch, viewNode, visibleName, type NodeView } from './nodeView';
import { PriceList } from './PriceList';

function levelText(view: NodeView): string {
  return t('tree.level', { level: String(view.level), max: String(view.node.maxLevel) });
}

function CardFooter({ view }: { view: NodeView }) {
  const { status, node } = view;
  if (status === 'hidden') return <span />;
  if (status === 'locked') return <span class="caption mute">{t('tree.status.locked')}</span>;
  if (status === 'maxed') {
    return (
      <>
        <span class="caption accent">{t('tree.status.maxed')}</span>
        <span class="caption accent">
          {node.maxLevel === 1 ? t('tree.status.opened') : levelText(view)}
        </span>
      </>
    );
  }
  return (
    <>
      {status === 'capped' ? (
        <span class="caption dim">{t('tree.status.capped')}</span>
      ) : (
        <PriceList prices={view.prices} affordable={view.affordable} />
      )}
      <span class="caption dim">{levelText(view)}</span>
    </>
  );
}

/** Classes shared by cards and group rows: status colours, selection and search dimming. */
export function stateClasses(view: NodeView): string {
  return [
    `status-${view.status}`,
    view.level > 0 ? 'owned' : '',
    view.affordable ? 'affordable' : '',
    selectedNode.value === view.node.id ? 'selected' : '',
    isDimmedBySearch(view.node.id) ? 'search-dimmed' : '',
  ].join(' ');
}

export function TreeCard({ placement }: { placement: Placement }) {
  const node = placement.nodes[0];
  if (!node) return null;
  const view = viewNode(node);
  const branch = branches.find((candidate) => candidate.id === node.branch);
  const hidden = view.status === 'hidden';
  return (
    <button
      type="button"
      class={`tree-card kind-${node.kind} ${stateClasses(view)}`}
      style={{ left: `${placement.x}px`, top: `${placement.y}px` }}
      onClick={() => (selectedNode.value = node.id)}
      onDblClick={() => buyNode(node.id)}
    >
      <span class="tree-card-icon">
        <NodeIcon icon={node.icon} size={28} />
      </span>
      <span class="tree-card-text">
        <span class="caption accent">
          {branch && !hidden ? t(branch.nameKey) : ''}
          {node.kind === 'key' && !hidden ? ` · ${t('tree.kind.key')}` : ''}
        </span>
        <span class="tree-card-name">{visibleName(view)}</span>
      </span>
      <span class="tree-card-footer" key={view.level}>
        <CardFooter view={view} />
      </span>
    </button>
  );
}
