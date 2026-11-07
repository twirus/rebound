import { branches } from '../../content/branches';
import { treeNodes } from '../../content/tree';
import { levelOf } from '../../game/state';
import { nodeLevels } from '../../game/store';
import { t } from '../../i18n';
import { bringToTopLeft } from './camera';
import { viewNode } from './nodeView';
import { treeLayout } from './TreeViewport';

/** Room left of a band for its stripe and above it for step captions. */
const BAND_FOCUS_PADDING = 40;

export function BranchPanel() {
  return (
    <nav class="branch-panel">
      {branches.map((branch) => {
        const nodes = treeNodes.filter((node) => node.branch === branch.id);
        const bought = nodes.filter((node) => levelOf(nodeLevels.value, node.id) > 0).length;
        const available = nodes.filter((node) => viewNode(node).affordable).length;
        const band = treeLayout.bands.find((candidate) => candidate.branch === branch.id);
        return (
          <button
            type="button"
            class="branch-row"
            key={branch.id}
            style={{ borderLeftColor: branch.color }}
            onClick={() =>
              band && bringToTopLeft(band.left - BAND_FOCUS_PADDING, band.top - BAND_FOCUS_PADDING)
            }
          >
            <span class="caption accent">{t(branch.nameKey)}</span>
            <span class="dim">
              {t('tree.branchCount', {
                bought: String(bought),
                total: String(nodes.length),
                available: String(available),
              })}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
