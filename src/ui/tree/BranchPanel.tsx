import { branches } from '../../content/branches';
import { treeNodes } from '../../content/tree';
import { levelOf } from '../../game/state';
import { nodeLevels } from '../../game/store';
import { t } from '../../i18n';
import { viewNode } from './nodeView';

export function BranchPanel() {
  return (
    <nav class="branch-panel">
      {branches.map((branch) => {
        const nodes = treeNodes.filter((node) => node.branch === branch.id);
        const bought = nodes.filter((node) => levelOf(nodeLevels.value, node.id) > 0).length;
        const available = nodes.filter((node) => viewNode(node).affordable).length;
        return (
          <div class="branch-row" key={branch.id} style={{ borderLeftColor: branch.color }}>
            <span class="caption accent">{t(branch.nameKey)}</span>
            <span class="dim">
              {t('tree.branchCount', {
                bought: String(bought),
                total: String(nodes.length),
                available: String(available),
              })}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
