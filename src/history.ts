import type { TileSnapshot } from './types';

export class History {
  private stack: TileSnapshot[][] = [];
  readonly maxSize: number;

  constructor(maxSize = 20) {
    this.maxSize = maxSize;
  }

  push(snapshot: TileSnapshot[]): void {
    this.stack.push(snapshot);
    if (this.stack.length > this.maxSize) this.stack.shift();
  }

  pop(): TileSnapshot[] | undefined {
    return this.stack.pop();
  }

  get length(): number {
    return this.stack.length;
  }
}
