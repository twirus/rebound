import type { TreeNodeDef } from '../../content/types';
import { buyNode } from '../../game/session';
import { t } from '../../i18n';
import { selectedNode } from '../uiState';
import { GROUP_HEADER_HEIGHT, type Placement } from './layout';
import { NodeIcon } from './NodeIcon';
import { viewNode, visibleName, type NodeView } from './nodeView';
import { PriceList } from './PriceList';
import { stateClasses } from './TreeCard';

function RowEnd({ view }: { view: NodeView }) {
  const level = t('tree.level', { level: String(view.level), max: String(view.node.maxLevel) });
  switch (view.status) {
    case 'hidden':
      return null;
    case 'locked':
      return <span class="caption mute">{t('tree.status.locked')}</span>;
    case 'maxed':
      return (
        <span class="caption accent">
          {t('tree.status.maxed')} {level}
        </span>
      );
    case 'capped':
      return <span class="caption dim">{t('tree.status.capped')}</span>;
    case 'available':
      return (
        <>
          <PriceList prices={view.prices} affordable={view.affordable} />
          <span class="caption dim">{level}</span>
        </>
      );
  }
}

function GroupRow({ node }: { node: TreeNodeDef }) {
  const view = viewNode(node);
  return (
    <button
      type="button"
      class={`tree-group-row ${stateClasses(view)}`}
      onClick={() => (selectedNode.value = node.id)}
      onDblClick={() => buyNode(node.id)}
    >
      <NodeIcon icon={node.icon} size={16} />
      <span class="tree-group-name">{visibleName(view)}</span>
      <span class="tree-group-end" key={view.level}>
        <RowEnd view={view} />
      </span>
    </button>
  );
}

export function TreeGroup({ placement }: { placement: Placement }) {
  const views = placement.nodes.map(viewNode);
  const hidden = views.every((view) => view.status === 'hidden');
  return (
    <div
      class={`tree-group ${hidden ? 'status-hidden' : ''}`}
      style={{ left: `${placement.x}px`, top: `${placement.y}px`, height: `${placement.height}px` }}
    >
      <div class="tree-group-header caption dim" style={{ height: `${GROUP_HEADER_HEIGHT}px` }}>
        {hidden || !placement.group ? t('tree.hiddenName') : t(placement.group.nameKey)}
      </div>
      {placement.nodes.map((node) => (
        <GroupRow key={node.id} node={node} />
      ))}
    </div>
  );
}
