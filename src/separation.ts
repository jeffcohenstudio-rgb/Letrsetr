const MAX_ITER = 60;
const PAD = 4;

export function separateTiles(
  tiles: HTMLElement[],
  sz: number,
  boardW: number,
  boardH: number,
  snapEnabled: boolean,
): boolean {
  const minDist = sz + PAD;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let moved = false;

    let gcx = 0, gcy = 0;
    for (const t of tiles) {
      gcx += parseFloat(t.style.left) + sz / 2;
      gcy += parseFloat(t.style.top) + sz / 2;
    }
    gcx /= tiles.length || 1;
    gcy /= tiles.length || 1;

    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const ax = parseFloat(tiles[i].style.left) + sz / 2;
        const ay = parseFloat(tiles[i].style.top) + sz / 2;
        const bx = parseFloat(tiles[j].style.left) + sz / 2;
        const by = parseFloat(tiles[j].style.top) + sz / 2;
        let dx = bx - ax, dy = by - ay;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          if (dist < 0.5) {
            dx = ax - gcx || 0.1;
            dy = ay - gcy || 0.1;
            dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          }
          const overlapH = minDist - Math.abs(dx);
          const overlapV = minDist - Math.abs(dy);
          let ux: number, uy: number;
          if (Math.abs(dx) >= Math.abs(dy)) {
            ux = (overlapH / 2) * (dx >= 0 ? 1 : -1);
            uy = 0;
          } else {
            ux = 0;
            uy = (overlapV / 2) * (dy >= 0 ? 1 : -1);
          }
          tiles[i].style.left = parseFloat(tiles[i].style.left) - ux + 'px';
          tiles[i].style.top = parseFloat(tiles[i].style.top) - uy + 'px';
          tiles[j].style.left = parseFloat(tiles[j].style.left) + ux + 'px';
          tiles[j].style.top = parseFloat(tiles[j].style.top) + uy + 'px';
          moved = true;
        }
      }
    }

    for (const t of tiles) {
      t.style.left = Math.max(0, Math.min(boardW - sz - PAD, parseFloat(t.style.left))) + 'px';
      t.style.top = Math.max(0, Math.min(boardH - sz - PAD, parseFloat(t.style.top))) + 'px';
    }

    if (!moved) break;
  }

  let fits = true;
  outer: for (let ii = 0; ii < tiles.length; ii++) {
    for (let jj = ii + 1; jj < tiles.length; jj++) {
      const ax = parseFloat(tiles[ii].style.left) + sz / 2;
      const ay = parseFloat(tiles[ii].style.top) + sz / 2;
      const bx = parseFloat(tiles[jj].style.left) + sz / 2;
      const by = parseFloat(tiles[jj].style.top) + sz / 2;
      const dx = bx - ax, dy = by - ay;
      if (Math.sqrt(dx * dx + dy * dy) < minDist - 1) {
        fits = false;
        break outer;
      }
    }
  }

  if (snapEnabled) {
    const grid = sz + 4;
    for (const t of tiles) {
      t.style.left = Math.round(parseFloat(t.style.left) / grid) * grid + 'px';
      t.style.top = Math.round(parseFloat(t.style.top) / grid) * grid + 'px';
    }
  }

  return fits;
}
