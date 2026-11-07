import type { GemDef } from '../types';
import { effectGems } from './effects';
import { eventGems } from './events';
import { supportGems } from './supports';

export const gems: readonly GemDef[] = [...eventGems, ...effectGems, ...supportGems];
