import { useEffect, useRef } from 'preact/hooks';
import { treeNodes } from '../../content/tree';
import { totalLevels } from '../../game/purchases';
import { nodeLevels, resourceAmounts } from '../../game/store';
import { t } from '../../i18n';
import { ResourceList } from '../ResourceList';
import { searchQuery, selectedNode, treeOpen } from '../uiState';
import { BranchPanel } from './BranchPanel';
import { centreOn } from './camera';
import { CARD_HEIGHT, CARD_WIDTH } from './layout';
import { searchMatches } from './nodeView';
import { TreeDetails } from './TreeDetails';
import { treeLayout, TreeViewport } from './TreeViewport';

const allLevels = treeNodes.reduce((sum, node) => sum + node.maxLevel, 0);

/** Selects the first match and brings its box to the middle of the screen. */
function showFirstMatch(): void {
  const matches = searchMatches.value;
  const placement = treeLayout.placements.find((candidate) =>
    candidate.nodes.some((node) => matches?.has(node.id)),
  );
  const node = placement?.nodes.find((candidate) => matches?.has(candidate.id));
  const viewport = document.querySelector('.tree-viewport');
  if (!placement || !node || !viewport) return;
  selectedNode.value = node.id;
  centreOn(
    placement.x + CARD_WIDTH / 2,
    placement.y + CARD_HEIGHT / 2,
    viewport.clientWidth,
    viewport.clientHeight,
  );
}

function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || document.activeElement === inputRef.current) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <input
      ref={inputRef}
      class="tree-search"
      type="search"
      placeholder={t('tree.search')}
      value={searchQuery.value}
      onInput={(event) => (searchQuery.value = event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') showFirstMatch();
        if (event.key === 'Escape') {
          event.stopPropagation();
          searchQuery.value = '';
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export function TreeOverlay() {
  return (
    <section class="tree-overlay" aria-label={t('tree.title')}>
      <header class="top-bar">
        <span class="title">{t('tree.title')}</span>
        <SearchBox />
        <ResourceList amounts={resourceAmounts.value} />
        <span class="spacer" />
        <button class="text-button accent" type="button" onClick={() => (treeOpen.value = false)}>
          {t('tree.close')}
        </button>
      </header>
      <div class="tree-body">
        <BranchPanel />
        <TreeViewport />
        <TreeDetails />
      </div>
      <footer class="bottom-bar">
        <span>
          {t('tree.levelsBought', {
            bought: String(totalLevels(nodeLevels.value)),
            total: String(allLevels),
          })}
        </span>
        <span class="separator hide-narrow">·</span>
        <span class="hide-narrow">{t('tree.hints')}</span>
        <span class="show-narrow">{t('tree.hintsTouch')}</span>
      </footer>
    </section>
  );
}
