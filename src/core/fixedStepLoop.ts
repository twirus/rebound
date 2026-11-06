/** Longest real time one frame may simulate; prevents a spiral of death after a stall. */
const MAX_FRAME_SECONDS = 0.25;

export interface FixedStepCallbacks {
  step: () => void;
  /** alpha ∈ [0, 1): how far real time is between the last two simulation steps. */
  render: (alpha: number) => void;
}

/**
 * Runs `step` at a fixed rate regardless of display refresh rate and renders
 * with interpolation, so motion is smooth on 60, 120 and 144 Hz screens alike.
 */
export class FixedStepLoop {
  private accumulator = 0;
  private lastTime: number | null = null;
  private frameRequest: number | null = null;

  constructor(
    private readonly stepSeconds: number,
    private readonly callbacks: FixedStepCallbacks,
  ) {}

  start(): void {
    if (this.frameRequest !== null) return;
    this.lastTime = null;
    this.frameRequest = requestAnimationFrame(this.onFrame);
  }

  stop(): void {
    if (this.frameRequest === null) return;
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = null;
  }

  private readonly onFrame = (timeMs: number): void => {
    const elapsed = this.lastTime === null ? 0 : (timeMs - this.lastTime) / 1000;
    this.lastTime = timeMs;
    this.accumulator += Math.min(elapsed, MAX_FRAME_SECONDS);
    while (this.accumulator >= this.stepSeconds) {
      this.callbacks.step();
      this.accumulator -= this.stepSeconds;
    }
    this.callbacks.render(this.accumulator / this.stepSeconds);
    this.frameRequest = requestAnimationFrame(this.onFrame);
  };
}
