import type { ShapeDef } from '../content/types';
import type { Stats } from './stats';

/** The shape as content defines it, with tree upgrades applied. */
export function tunedShape(def: ShapeDef, stats: Stats): ShapeDef {
  if (!def.rings) return def;
  return {
    ...def,
    rings: {
      ...def.rings,
      count: def.rings.count + stats['stat:ring-count'],
      gapDegrees: def.rings.gapDegrees + stats['stat:ring-gap'],
      regrowSeconds: def.rings.regrowSeconds * stats['stat:ring-regrow'],
    },
  };
}
