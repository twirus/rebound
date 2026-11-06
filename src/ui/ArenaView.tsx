import { useEffect, useRef } from 'preact/hooks';
import { FixedStepLoop } from '../core/fixedStepLoop';
import { ArenaRenderer } from '../render/arenaRenderer';
import { TICK_SECONDS } from '../sim/constants';
import { stepWorld } from '../sim/step';
import type { World } from '../sim/world';

interface ArenaViewProps {
  world: World;
}

export function ArenaView({ world }: ArenaViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new ArenaRenderer(canvas);
    const loop = new FixedStepLoop(TICK_SECONDS, {
      step: () => stepWorld(world),
      render: (alpha) => renderer.draw(world, alpha),
    });

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      renderer.resize(entry.contentRect.width, entry.contentRect.height);
      renderer.draw(world, 0);
    });
    observer.observe(canvas);

    // Hidden tab: no simulation and no drawing (offline income will cover the gap later).
    const onVisibilityChange = () => (document.hidden ? loop.stop() : loop.start());
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!document.hidden) loop.start();

    return () => {
      loop.stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [world]);

  return (
    <main class="arena-view">
      <canvas ref={canvasRef} />
    </main>
  );
}
