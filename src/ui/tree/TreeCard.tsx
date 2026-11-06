import { branches } from '../../content/branches';
import { t } from '../../i18n';
import type { Placement } from './layout';
import type { NodeView } from './nodeView';
import { PriceList } from './PriceList';

interface TreeCardProps {
  placement: Placement;
  view: NodeView;
  selected: boolean;
  onSelect: () => void;
  onBuy: () => void;
}

function CardFooter({ view }: { view: NodeView }) {
  const { status, level, node } = view;
  const levelText = t('tree.level', { level: String(level), max: String(node.maxLevel) });
  if (status === 'hidden') return <span />;
  if (status === 'locked') return <span class="caption mute">{t('tree.status.locked')}</span>;
  if (status === 'maxed') {
    return (
      <>
        <span class="caption accent">{t('tree.status.maxed')}</span>
        <span class="caption accent">{levelText}</span>
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
      <span class="caption dim">{levelText}</span>
    </>
  );
}

export function TreeCard({ placement, view, selected, onSelect, onBuy }: TreeCardProps) {
  const branch = branches.find((candidate) => candidate.id === view.node.branch);
  const hidden = view.status === 'hidden';
  const classes = [
    'tree-card',
    `status-${view.status}`,
    view.level > 0 ? 'owned' : '',
    view.affordable ? 'affordable' : '',
    selected ? 'selected' : '',
  ].join(' ');
  return (
    <button
      type="button"
      class={classes}
      style={{ left: `${placement.x}px`, top: `${placement.y}px` }}
      onClick={onSelect}
      onDblClick={onBuy}
    >
      <span class="caption accent">{branch && !hidden ? t(branch.nameKey) : ''}</span>
      <span class="tree-card-name">{hidden ? t('tree.hiddenName') : t(view.node.nameKey)}</span>
      <span class="tree-card-footer" key={view.level}>
        <CardFooter view={view} />
      </span>
    </button>
  );
}
