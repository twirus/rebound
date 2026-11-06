import { resources } from '../content/resources';
import type { ResourceId } from '../content/types';
import { TICK_SECONDS } from '../sim/constants';
import { INCOME_WINDOW_SECONDS } from './balance';
import { emptyResources, type ResourceTable } from './state';

const TICKS_PER_SECOND = Math.round(1 / TICK_SECONDS);

/** Rolling average of income per second over the last few full seconds. */
export class IncomeTracker {
  private readonly finishedSeconds: ResourceTable[] = [];
  private current: ResourceTable = emptyResources();
  private ticksInCurrent = 0;

  add(resource: ResourceId, amount: number): void {
    this.current[resource] = (this.current[resource] ?? 0) + amount;
  }

  endTick(): void {
    this.ticksInCurrent += 1;
    if (this.ticksInCurrent < TICKS_PER_SECOND) return;
    this.finishedSeconds.push(this.current);
    if (this.finishedSeconds.length > INCOME_WINDOW_SECONDS) this.finishedSeconds.shift();
    this.current = emptyResources();
    this.ticksInCurrent = 0;
  }

  perSecond(): ResourceTable {
    const average = emptyResources();
    const seconds = this.finishedSeconds.length;
    if (seconds === 0) return average;
    for (const resource of resources) {
      let total = 0;
      for (const second of this.finishedSeconds) total += second[resource.id] ?? 0;
      average[resource.id] = total / seconds;
    }
    return average;
  }
}
