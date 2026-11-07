import { useEffect, useRef } from 'preact/hooks';
import { branches } from '../../content/branches';
import { treeGroups, treeNodes } from '../../content/tree';
import { levelOf } from '../../game/state';
import { nodeLevels } from '../../game/store';
import { t } from '../../i18n';
import { camera } from './camera';
import { attachCameraControls } from './cameraControls';
import { CARD_WIDTH, COLUMN_WIDTH, layoutTree } from './layout';
import { TreeCard } from './TreeCard';
import { TreeGroup } from './TreeGroup';

/** Height of the step captions above the first band. */
const HEADER_OFFSET = 32;
/** Band stripes sit this far left of the first column. */
const STRIPE_OFFSET = 20;

export const treeLayout = layoutTree(
  treeNodes,
  treeGroups,
  branches.map((branch) => branch.id),
);

function ColumnHeaders() {
  return (
    <div class="tree-columns" style={{ top: `${-HEADER_OFFSET}px` }}>
      {Array.from({ length: treeLayout.columns }, (_, column) => (
        <span
          key={column}
          class="caption dim"
          style={{ left: `${column * COLUMN_WIDTH}px`, width: `${CARD_WIDTH}px` }}
        >
          {column === 0 ? t('tree.start') : t('tree.step', { step: String(column) })}
        </span>
      ))}
    </div>
  );
}

function BandStripes() {
  return (
    <>
      {treeLayout.bands.map((band) => (
        <div
          key={band.branch}
          class="tree-band-stripe"
          style={{
            left: `${band.left - STRIPE_OFFSET}px`,
            top: `${band.top}px`,
            height: `${band.height}px`,
            background: branches.find((branch) => branch.id === band.branch)?.color,
          }}
        />
      ))}
    </>
  );
}

function Links() {
  const levels = nodeLevels.value;
  return (
    <svg class="tree-lines" width={treeLayout.width} height={treeLayout.height} aria-hidden="true">
      {treeLayout.edges.map((edge) => {
        const active = edge.links.some(
          (link) => levelOf(levels, link.source) > 0 && levelOf(levels, link.target) > 0,
        );
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={edge.path}
            pathLength={1}
            class={active ? 'line-active' : 'line-idle'}
          />
        );
      })}
    </svg>
  );
}

export function TreeViewport() {
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    return viewport ? attachCameraControls(viewport) : undefined;
  }, []);
  const { x, y, scale } = camera.value;
  return (
    <div class="tree-viewport" ref={viewportRef}>
      <div
        class="tree-canvas"
        style={{
          width: `${treeLayout.width}px`,
          height: `${treeLayout.height}px`,
          transform: `translate(${x}px, ${y + HEADER_OFFSET * scale}px) scale(${scale})`,
        }}
      >
        <ColumnHeaders />
        <BandStripes />
        <Links />
        {treeLayout.placements.map((placement) =>
          placement.group ? (
            <TreeGroup key={placement.id} placement={placement} />
          ) : (
            <TreeCard key={placement.id} placement={placement} />
          ),
        )}
      </div>
    </div>
  );
}
