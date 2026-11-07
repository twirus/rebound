import { signal } from '@preact/signals';
import type { NodeId } from '../content/types';
import type { GemSlotRef } from '../game/gemRules';

export const treeOpen = signal(false);
export const selectedNode = signal<NodeId | null>(null);
export const searchQuery = signal('');
export const workshopOpen = signal(false);
/** The gem slot whose picker is open in the arena panel. */
export const openGemSlot = signal<GemSlotRef | null>(null);
