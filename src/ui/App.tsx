import { useEffect } from 'preact/hooks';
import { ArenaPanel } from './ArenaPanel';
import { ArenaView } from './ArenaView';
import { BottomBar } from './BottomBar';
import { TopBar } from './TopBar';
import { TreeOverlay } from './tree/TreeOverlay';
import { treeOpen, workshopOpen } from './uiState';
import { WorkshopOverlay } from './workshop/WorkshopOverlay';

function onKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof HTMLInputElement) return;
  if (event.code === 'KeyT') treeOpen.value = !treeOpen.value;
  else if (event.code === 'Escape') {
    treeOpen.value = false;
    workshopOpen.value = false;
  }
}

export function App() {
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div class="app">
      <TopBar />
      <div class="main-row">
        <ArenaView />
        <ArenaPanel />
      </div>
      <BottomBar />
      {workshopOpen.value && <WorkshopOverlay />}
      {treeOpen.value && <TreeOverlay />}
    </div>
  );
}
