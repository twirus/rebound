/*
 * Trigonometry built only from + - * / and Math.floor, which IEEE 754 specifies
 * exactly, so every engine gets bit-identical results (Math.sin/cos may differ).
 * Accuracy is about 1e-15 — far beyond what the simulation needs.
 */

const HALF_PI = Math.PI / 2;
const TWO_PI = Math.PI * 2;

/** Taylor series of sin on [-π/4, π/4]. */
function sinNearZero(x: number): number {
  const x2 = x * x;
  return (
    x *
    (1 -
      (x2 / 6) *
        (1 - (x2 / 20) * (1 - (x2 / 42) * (1 - (x2 / 72) * (1 - (x2 / 110) * (1 - x2 / 156))))))
  );
}

/** Taylor series of cos on [-π/4, π/4]. */
function cosNearZero(x: number): number {
  const x2 = x * x;
  return (
    1 -
    (x2 / 2) *
      (1 - (x2 / 12) * (1 - (x2 / 30) * (1 - (x2 / 56) * (1 - (x2 / 90) * (1 - x2 / 132)))))
  );
}

/** Splits the angle into a quarter-turn count and a remainder in [-π/4, π/4]. */
function reduce(angle: number): { quadrant: number; rest: number } {
  const turns = Math.floor(angle / TWO_PI);
  const wrapped = angle - turns * TWO_PI;
  const quarter = Math.floor(wrapped / HALF_PI + 0.5);
  return { quadrant: quarter % 4, rest: wrapped - quarter * HALF_PI };
}

export function detSin(angle: number): number {
  const { quadrant, rest } = reduce(angle);
  if (quadrant === 0) return sinNearZero(rest);
  if (quadrant === 1) return cosNearZero(rest);
  if (quadrant === 2) return -sinNearZero(rest);
  return -cosNearZero(rest);
}

export function detCos(angle: number): number {
  const { quadrant, rest } = reduce(angle);
  if (quadrant === 0) return cosNearZero(rest);
  if (quadrant === 1) return -sinNearZero(rest);
  if (quadrant === 2) return -cosNearZero(rest);
  return sinNearZero(rest);
}
