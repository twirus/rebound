import { gems } from '../content/gems';
import type { GemDef, GemId, GemKind } from '../content/types';
import type { SchemeSpec } from '../sim/gems';
import { emptySchemeSlot, type ArenaSetup, type NodeLevels } from './state';
import type { Stats } from './stats';
import { isContentUnlocked } from './unlocks';

/** A place for one gem in the arena panel. */
export type GemSlotRef =
  | { part: 'law' }
  | { part: 'event' | 'effect'; scheme: number }
  | { part: 'support'; scheme: number; index: number };

/** Why a gem cannot go where the player tried to put it. */
export type PlaceProblem = 'locked' | 'wrong-kind' | 'no-slot' | 'overload';

export function findGemDef(id: GemId): GemDef {
  const gem = gems.find((candidate) => candidate.id === id);
  if (!gem) throw new Error(`Unknown gem ${id}`);
  return gem;
}

export function ownedGems(levels: NodeLevels): GemDef[] {
  return gems.filter((gem) => isContentUnlocked(gem.id, levels));
}

/** Gem kinds each kind of slot accepts. Conditions sit in support slots. */
const ACCEPTS: Readonly<Record<GemSlotRef['part'], readonly GemKind[]>> = {
  law: ['law'],
  event: ['event'],
  effect: ['effect'],
  support: ['support', 'condition'],
};

export function accepts(slot: GemSlotRef, gem: GemDef): boolean {
  return ACCEPTS[slot.part].includes(gem.kind);
}

/** Only rows and support places the arena actually has run. */
function activeSchemes(setup: ArenaSetup, stats: Stats) {
  return setup.schemes.slice(0, stats['stat:scheme-slots']).map((scheme) => ({
    ...scheme,
    supports: scheme.supports.slice(0, stats['stat:support-slots']),
  }));
}

export function gemAt(setup: ArenaSetup, slot: GemSlotRef): GemId | null {
  if (slot.part === 'law') return setup.law;
  const scheme = setup.schemes[slot.scheme];
  if (!scheme) return null;
  if (slot.part === 'support') return scheme.supports[slot.index] ?? null;
  return scheme[slot.part];
}

/** Every gem in an active place, with no repeats (each gem exists once). */
export function placedGems(setup: ArenaSetup, stats: Stats): GemId[] {
  const placed = activeSchemes(setup, stats).flatMap((scheme) => [
    scheme.event,
    scheme.effect,
    ...scheme.supports,
  ]);
  if (stats['stat:law-slots'] > 0) placed.push(setup.law);
  return placed.filter((id): id is GemId => id !== null);
}

export function loadUsed(setup: ArenaSetup, stats: Stats): number {
  return placedGems(setup, stats).reduce((sum, id) => sum + findGemDef(id).load, 0);
}

function slotExists(slot: GemSlotRef, stats: Stats): boolean {
  if (slot.part === 'law') return stats['stat:law-slots'] > 0;
  if (slot.scheme >= stats['stat:scheme-slots']) return false;
  return slot.part !== 'support' || slot.index < stats['stat:support-slots'];
}

/** Null when the gem can go into the slot (moving it from wherever it is now). */
export function placeProblem(
  setup: ArenaSetup,
  slot: GemSlotRef,
  gemId: GemId,
  levels: NodeLevels,
  stats: Stats,
): PlaceProblem | null {
  const gem = findGemDef(gemId);
  if (!isContentUnlocked(gemId, levels)) return 'locked';
  if (!accepts(slot, gem)) return 'wrong-kind';
  if (!slotExists(slot, stats)) return 'no-slot';
  const moving = placedGems(setup, stats).includes(gemId) ? gem.load : 0;
  const replaced = gemAt(setup, slot);
  const freed = replaced && replaced !== gemId ? findGemDef(replaced).load : 0;
  const load = loadUsed(setup, stats) - moving - freed + gem.load;
  return load > stats['stat:gem-load'] ? 'overload' : null;
}

function writeSlot(setup: ArenaSetup, slot: GemSlotRef, gemId: GemId | null): void {
  if (slot.part === 'law') {
    setup.law = gemId;
    return;
  }
  while (setup.schemes.length <= slot.scheme) setup.schemes.push(emptySchemeSlot());
  const scheme = setup.schemes[slot.scheme];
  if (!scheme) return;
  if (slot.part === 'support') {
    while (scheme.supports.length <= slot.index) scheme.supports.push(null);
    scheme.supports[slot.index] = gemId;
  } else {
    scheme[slot.part] = gemId;
  }
}

/** Takes the gem out of wherever it sits. */
function lift(setup: ArenaSetup, gemId: GemId): void {
  if (setup.law === gemId) setup.law = null;
  for (const scheme of setup.schemes) {
    if (scheme.event === gemId) scheme.event = null;
    if (scheme.effect === gemId) scheme.effect = null;
    scheme.supports = scheme.supports.map((id) => (id === gemId ? null : id));
  }
}

/** Puts the gem into the slot, moving it there if it sat elsewhere. Mutates `setup`. */
export function placeGem(setup: ArenaSetup, slot: GemSlotRef, gemId: GemId): void {
  lift(setup, gemId);
  writeSlot(setup, slot, gemId);
}

export function clearSlot(setup: ArenaSetup, slot: GemSlotRef): void {
  writeSlot(setup, slot, null);
}

/** Complete schemes in active rows, ready for the simulation. */
export function schemeSpecs(setup: ArenaSetup, stats: Stats): SchemeSpec[] {
  return activeSchemes(setup, stats).flatMap((scheme) =>
    scheme.event && scheme.effect
      ? [
          {
            event: scheme.event,
            effect: scheme.effect,
            supports: scheme.supports.filter((id): id is GemId => id !== null),
          },
        ]
      : [],
  );
}
