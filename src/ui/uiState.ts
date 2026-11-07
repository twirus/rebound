import { signal } from '@preact/signals';
import type { NodeId } from '../content/types';

export const treeOpen = signal(false);
export const selectedNode = signal<NodeId | null>(null);
export const searchQuery = signal('');
