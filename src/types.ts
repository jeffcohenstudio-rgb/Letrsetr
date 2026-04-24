export type Point = [number, number];
export type ColorTarget = 'bg' | 'tiles';

export interface TileSnapshot {
  letter: string;
  left: string;
  top: string;
  rot: number;
}

export interface LayoutData {
  size: number;
  tiles: TileSnapshot[];
}
