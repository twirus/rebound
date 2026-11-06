import { useEffect } from 'preact/hooks';
import { ArenaView } from './ArenaView';
import { BottomBar } from './BottomBar';
import { TopBar } from './TopBar';
import { TreeOverlay } from './tree/TreeOverlay';
import { treeOpen } from './uiState';

function onKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'KeyT') treeOpen.value = !treeOpen.value;
  else if (event.code === 'Escape') treeOpen.value = false;
}

export function App() {
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div class="app">
      <TopBar />
      <ArenaView />
      <BottomBar />
      {treeOpen.value && <TreeOverlay />}
    </div>
  );
}
