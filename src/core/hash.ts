const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * FNV-1a over the exact bit patterns of float64 values. Comparing bits (not
 * rounded numbers) catches the smallest divergence between two runs.
 */
export class StateHasher {
  private hash = FNV_OFFSET;
  private readonly view = new DataView(new ArrayBuffer(8));

  addNumber(value: number): void {
    this.view.setFloat64(0, value);
    for (let index = 0; index < 8; index++) {
      this.hash = Math.imul(this.hash ^ this.view.getUint8(index), FNV_PRIME) >>> 0;
    }
  }

  digest(): string {
    return this.hash.toString(16).padStart(8, '0');
  }
}
