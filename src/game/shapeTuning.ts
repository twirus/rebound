import type { ShapeDef } from '../content/types';
import type { Stats } from './stats';

/** Fewest hits a combo or a portal shift can need, whatever the upgrades. */
const MIN_COUNT = 1;
/** Shortest charge a star ray can be upgraded to. */
const MIN_CHARGE_SECONDS = 0.25;

function tunedRings(def: ShapeDef, stats: Stats): ShapeDef {
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

/** The shape as content defines it, with tree upgrades applied. */
export function tunedShape(def: ShapeDef, stats: Stats): ShapeDef {
  const tuned = tunedRings(def, stats);
  return {
    ...tuned,
    ...(def.triangle && {
      triangle: {
        ...def.triangle,
        cornerShare: def.triangle.cornerShare + stats['stat:corner-share'],
        cloneSeconds: def.triangle.cloneSeconds + stats['stat:clone-seconds'],
      },
    }),
    ...(def.square && {
      square: {
        hitsPerShift: Math.max(MIN_COUNT, def.square.hitsPerShift + stats['stat:portal-shift']),
      },
    }),
    ...(def.mosaic && {
      mosaic: {
        ...def.mosaic,
        durability: Math.max(MIN_COUNT, def.mosaic.durability + stats['stat:tile-durability']),
      },
    }),
    ...(def.spiral && {
      spiral: { ...def.spiral, pull: def.spiral.pull * stats['stat:spiral-pull'] },
    }),
    ...(def.star && {
      star: {
        ...def.star,
        chargeSeconds: Math.max(
          MIN_CHARGE_SECONDS,
          def.star.chargeSeconds + stats['stat:charge-seconds'],
        ),
      },
    }),
    ...(def.hexagon && {
      hexagon: {
        ...def.hexagon,
        comboLength: Math.max(MIN_COUNT, def.hexagon.comboLength + stats['stat:combo-length']),
      },
    }),
  };
}
