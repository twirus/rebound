/**
 * Uniform grid over a square [-halfSize, halfSize]² with linked lists in typed
 * arrays: rebuilding it each substep allocates nothing once capacity is reached.
 */
export class SpatialGrid {
  private cellSize = 1;
  private columns = 0;
  private halfSize = 0;
  private heads = new Int32Array(0);
  private next = new Int32Array(0);

  rebuild(
    halfSize: number,
    cellSize: number,
    xs: Float64Array,
    ys: Float64Array,
    count: number,
  ): void {
    this.halfSize = halfSize;
    this.cellSize = cellSize;
    this.columns = Math.max(1, Math.ceil((halfSize * 2) / cellSize));
    const cellCount = this.columns * this.columns;
    if (this.heads.length < cellCount) this.heads = new Int32Array(cellCount);
    if (this.next.length < count) this.next = new Int32Array(Math.max(count, this.next.length * 2));
    this.heads.fill(-1, 0, cellCount);
    for (let index = 0; index < count; index++) {
      const cell = this.cellIndex(this.columnOf(xs[index] ?? 0), this.columnOf(ys[index] ?? 0));
      this.next[index] = this.heads[cell] ?? -1;
      this.heads[cell] = index;
    }
  }

  columnOf(coordinate: number): number {
    const column = Math.floor((coordinate + this.halfSize) / this.cellSize);
    return Math.min(this.columns - 1, Math.max(0, column));
  }

  /** First item index in a cell, or -1 for an empty or out-of-range cell. */
  firstIn(column: number, row: number): number {
    if (column < 0 || row < 0 || column >= this.columns || row >= this.columns) return -1;
    return this.heads[this.cellIndex(column, row)] ?? -1;
  }

  nextAfter(index: number): number {
    return this.next[index] ?? -1;
  }

  private cellIndex(column: number, row: number): number {
    return row * this.columns + column;
  }
}
