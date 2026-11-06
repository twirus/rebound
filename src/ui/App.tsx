import { ArenaView } from './ArenaView';
import { BottomBar } from './BottomBar';
import { TopBar } from './TopBar';
import type { World } from '../sim/world';

interface AppProps {
  world: World;
}

export function App({ world }: AppProps) {
  return (
    <div class="app">
      <TopBar />
      <ArenaView world={world} />
      <BottomBar />
    </div>
  );
}
