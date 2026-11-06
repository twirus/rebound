/**
 * Seeded PRNG (mulberry32). Uses only 32-bit integer math, so the sequence is
 * identical in every JS engine and easy to port to Luau.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform float in [0, 1). */
  nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let mixed = this.state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform float in [min, max). */
  nextRange(min: number, max: number): number {
    return min + (max - min) * this.nextFloat();
  }

  getState(): number {
    return this.state;
  }
}
