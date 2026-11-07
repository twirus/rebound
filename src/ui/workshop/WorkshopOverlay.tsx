import { effect, signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { FixedStepLoop } from '../../core/fixedStepLoop';
import { DEFAULT_WORKSHOP, Workshop, type WorkshopSettings } from '../../game/workshop';
import { t } from '../../i18n';
import { ArenaRenderer } from '../../render/arenaRenderer';
import { TICK_SECONDS } from '../../sim/constants';
import { workshopOpen } from '../uiState';
import { WorkshopControls } from './WorkshopControls';

/** Kept while the game runs, so reopening the Workshop shows the last build. */
export const workshopSettings = signal<WorkshopSettings>(DEFAULT_WORKSHOP);

function startSandbox(canvas: HTMLCanvasElement): () => void {
  const workshop = new Workshop(workshopSettings.value);
  const renderer = new ArenaRenderer(canvas);
  const loop = new FixedStepLoop(TICK_SECONDS, {
    step: () => {
      workshop.step();
      renderer.collectEvents(workshop.world);
    },
    render: (alpha) => renderer.draw(workshop.world, alpha),
  });
  const observer = new ResizeObserver(([entry]) => {
    if (!entry) return;
    renderer.resize(entry.contentRect.width, entry.contentRect.height);
  });
  observer.observe(canvas);
  const stopRebuild = effect(() => workshop.rebuild(workshopSettings.value));
  const onPointerDown = (event: PointerEvent) => {
    const point = renderer.screenToArena(workshop.world, event.offsetX, event.offsetY);
    workshop.tap(point.x, point.y);
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  loop.start();
  return () => {
    loop.stop();
    observer.disconnect();
    stopRebuild();
    canvas.removeEventListener('pointerdown', onPointerDown);
  };
}

/** A sandbox: build any arena from what is unlocked and watch it. Earns nothing. */
export function WorkshopOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    return canvas ? startSandbox(canvas) : undefined;
  }, []);
  return (
    <section class="workshop-overlay" aria-label={t('workshop.title')}>
      <header class="top-bar">
        <span class="title">{t('workshop.title')}</span>
        <span class="dim hide-narrow">{t('workshop.subtitle')}</span>
        <span class="spacer" />
        <button
          class="text-button accent"
          type="button"
          onClick={() => (workshopOpen.value = false)}
        >
          {t('tree.close')}
        </button>
      </header>
      <div class="workshop-body">
        <main class="arena-view">
          <canvas ref={canvasRef} />
        </main>
        <WorkshopControls
          settings={workshopSettings.value}
          onChange={(next) => (workshopSettings.value = next)}
        />
      </div>
      <footer class="bottom-bar">
        <span>{t('workshop.hints')}</span>
      </footer>
    </section>
  );
}
