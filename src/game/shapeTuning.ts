import type { ShapeDef } from '../content/types';
import type { Stats } from './stats';

/** The shape as content defines it, with tree upgrades applied. */
export function tunedShape(def: ShapeDef, stats: Stats): ShapeDef {
  if (!def.rings) return def;
  const count = def.rings.count + stats['stat:ring-count'];
  return {
    ...def,
    radius: def.rings.innerRadius + def.rings.spacing * (count - 1),
    rings: {
      ...def.rings,
      count,
      gapDegrees: def.rings.gapDegrees + stats['stat:ring-gap'],
      degreesPerSecond: def.rings.degreesPerSecond * stats['stat:ring-spin'],
    },
  };
}
