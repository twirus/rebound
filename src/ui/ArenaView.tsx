import { effect } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { HitSynth } from '../audio/hitSynth';
import { FixedStepLoop } from '../core/fixedStepLoop';
import { game, startAutosave, stepGame, tapArena } from '../game/session';
import { ArenaRenderer } from '../render/arenaRenderer';
import { TICK_SECONDS } from '../sim/constants';
import { soundEnabled } from './settings';

function createLoop(renderer: ArenaRenderer, synth: HitSynth): FixedStepLoop {
  return new FixedStepLoop(TICK_SECONDS, {
    step: () => {
      stepGame();
      renderer.collectEvents(game.world);
      synth.collect(game.world);
    },
    render: (alpha) => {
      renderer.draw(game.world, alpha);
      synth.startFrame();
    },
  });
}

function startArena(canvas: HTMLCanvasElement): () => void {
  const renderer = new ArenaRenderer(canvas);
  const synth = new HitSynth();
  const loop = createLoop(renderer, synth);
  const observer = new ResizeObserver(([entry]) => {
    if (!entry) return;
    renderer.resize(entry.contentRect.width, entry.contentRect.height);
    renderer.draw(game.world, 0);
  });
  observer.observe(canvas);

  const onPointerDown = (event: PointerEvent) => {
    synth.unlock();
    const point = renderer.screenToArena(game.world, event.offsetX, event.offsetY);
    tapArena(point.x, point.y);
  };
  const unlockAudio = () => synth.unlock();
  // Hidden tab: no simulation, no drawing, no sound (offline income comes in a later stage).
  const onVisibilityChange = () => {
    if (document.hidden) {
      loop.stop();
      synth.suspend();
    } else {
      loop.start();
      synth.resume();
    }
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', unlockAudio);
  document.addEventListener('visibilitychange', onVisibilityChange);
  const stopSoundSetting = effect(() => synth.setEnabled(soundEnabled.value));
  const stopAutosave = startAutosave();
  if (!document.hidden) loop.start();

  return () => {
    loop.stop();
    observer.disconnect();
    stopAutosave();
    stopSoundSetting();
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export function ArenaView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    return canvas ? startArena(canvas) : undefined;
  }, []);

  return (
    <main class="arena-view">
      <canvas ref={canvasRef} />
    </main>
  );
}
