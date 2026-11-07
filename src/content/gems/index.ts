import type { GemDef } from '../types';
import { effectGems } from './effects';
import { eventGems } from './events';
import { lawGems } from './laws';
import { supportGems } from './supports';

export const gems: readonly GemDef[] = [...eventGems, ...effectGems, ...supportGems, ...lawGems];
