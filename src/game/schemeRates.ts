import { TICK_SECONDS } from '../sim/constants';

const TICKS_PER_SAMPLE = Math.round(1 / TICK_SECONDS);
/** Rates are averaged over the last minute (or less, right after a rebuild). */
const WINDOW_SAMPLES = 60;
const SECONDS_PER_MINUTE = 60;

/** Firings per minute of each arena scheme, from once-a-second snapshots of their counters. */
export class SchemeRates {
  private samples: number[][] = [];

  record(tick: number, schemes: readonly { fired: number }[]): void {
    if (tick % TICKS_PER_SAMPLE !== 0) return;
    const fired = schemes.map((scheme) => scheme.fired);
    const last = this.samples[this.samples.length - 1];
    // Counters restart when the schemes are rebuilt; old samples no longer compare.
    const restarted =
      last && (last.length !== fired.length || fired.some((value, i) => value < (last[i] ?? 0)));
    if (restarted) this.samples = [];
    this.samples.push(fired);
    if (this.samples.length > WINDOW_SAMPLES + 1) this.samples.shift();
  }

  perMinute(): number[] {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    if (!first || !last || this.samples.length < 2) return last ? last.map(() => 0) : [];
    const seconds = this.samples.length - 1;
    return last.map(
      (value, index) => ((value - (first[index] ?? 0)) * SECONDS_PER_MINUTE) / seconds,
    );
  }
}
