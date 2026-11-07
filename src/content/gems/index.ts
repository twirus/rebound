import type { GemDef } from '../types';
import { effectGems } from './effects';
import { eventGems } from './events';

export const gems: readonly GemDef[] = [...eventGems, ...effectGems];
