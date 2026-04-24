interface PieColor {
  h: number;
  s: number;
  l: number;
}

const COLORS: PieColor[] = [
  { h: 0,   s: 85, l: 55 },
  { h: 30,  s: 90, l: 55 },
  { h: 58,  s: 90, l: 58 },
  { h: 130, s: 70, l: 42 },
  { h: 190, s: 80, l: 45 },
  { h: 225, s: 80, l: 52 },
  { h: 275, s: 75, l: 55 },
];

const R_INNER = 42;
const R_OUTER = 107;
const N = COLORS.length;
const PAD = 13;

function makePath(i: number, ri: number, ro: number): string {
  const slice = (2 * Math.PI) / N;
  const start = slice * i - Math.PI / 2 - slice / 2 + 0.04;
  const end   = slice * i - Math.PI / 2 + slice / 2 - 0.04;
  const x1 = Math.cos(start), y1 = Math.sin(start);
  const x2 = Math.cos(end),   y2 = Math.sin(end);
  return [
    'M', x1 * ri, y1 * ri, 'L', x1 * ro, y1 * ro,
    'A', ro, ro, 0, 0, 1, x2 * ro, y2 * ro,
    'L', x2 * ri, y2 * ri,
    'A', ri, ri, 0, 0, 0, x1 * ri, y1 * ri, 'Z',
  ].join(' ');
}

function applyTint(tile: HTMLElement, color: string): void {
  const tint = tile.querySelector<HTMLElement>('.tile-tint');
  if (tint) tint.style.background = color;
}

export function initPieMenu(getTopZ: () => number, bumpTopZ: () => number): void {
  const pieMenu = document.getElementById('pie-menu')!;
  const pieSvg  = document.getElementById('pie-svg')!;

  let activeTile: (HTMLElement & { _prevTint?: string; _boardParent?: Node; _boardLeft?: string; _boardTop?: string }) | null = null;
  const pieCenter = { x: 0, y: 0 };
  let hoveredIdx = -1;
  let sliceEls: SVGPathElement[] = [];

  function buildPie(): void {
    pieSvg.innerHTML = '';
    sliceEls = [];
    const size = (R_OUTER + PAD) * 2;
    pieSvg.setAttribute('width',  String(size));
    pieSvg.setAttribute('height', String(size));

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${size / 2},${size / 2})`);

    COLORS.forEach((c, i) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', makePath(i, R_INNER, R_OUTER));
      path.setAttribute('fill', `hsl(${c.h},${c.s}%,${c.l}%)`);
      path.setAttribute('stroke', 'rgba(0,0,0,0.18)');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('pointer-events', 'none');
      g.appendChild(path);
      sliceEls.push(path);
    });

    const hs = R_INNER - 2;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(-hs)); rect.setAttribute('y', String(-hs));
    rect.setAttribute('width', String(hs * 2)); rect.setAttribute('height', String(hs * 2));
    rect.setAttribute('rx', '5');
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', 'rgba(255,255,255,0.4)');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('pointer-events', 'none');
    g.appendChild(rect);
    pieSvg.appendChild(g);
  }

  function setHovered(idx: number): void {
    if (idx === hoveredIdx) return;
    hoveredIdx = idx;
    sliceEls.forEach((el, i) => {
      el.setAttribute('opacity', i === idx ? '0.75' : '1');
      el.setAttribute('transform', i === idx ? 'scale(1.06)' : '');
    });
  }

  function idxFromPoint(cx: number, cy: number): number {
    const dx = cx - pieCenter.x, dy = cy - pieCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < R_INNER || dist > R_OUTER) return -1;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    return Math.floor((angle / (2 * Math.PI)) * N) % N;
  }

  function onPieMove(e: PointerEvent): void {
    const idx = idxFromPoint(e.clientX, e.clientY);
    setHovered(idx);
    if (activeTile) {
      if (idx === -1) {
        applyTint(activeTile, activeTile._prevTint ?? '');
      } else {
        const c = COLORS[idx];
        applyTint(activeTile, `hsl(${c.h},${c.s}%,${c.l}%)`);
      }
    }
  }

  function onPieUp(e: PointerEvent): void {
    const idx = idxFromPoint(e.clientX, e.clientY);
    if (activeTile) {
      if (idx === -1) {
        applyTint(activeTile, '');
      } else {
        const c = COLORS[idx];
        applyTint(activeTile, `hsl(${c.h},${c.s}%,${c.l}%)`);
      }
    }
    hidePie();
  }

  function hidePie(): void {
    pieMenu.classList.remove('visible');
    if (activeTile?._boardParent) {
      activeTile.style.position = 'absolute';
      activeTile.style.left = activeTile._boardLeft ?? '';
      activeTile.style.top  = activeTile._boardTop ?? '';
      activeTile.style.zIndex = String(bumpTopZ());
      activeTile._boardParent.appendChild(activeTile);
    }
    document.removeEventListener('pointermove', onPieMove);
    document.removeEventListener('pointerup',   onPieUp);
    activeTile = null;
  }

  (window as Window & { showPieMenu?: (tile: HTMLElement, cx: number, cy: number) => void }).showPieMenu =
    function showPieMenu(tile: HTMLElement, _cx: number, _cy: number): void {
      activeTile = tile;
      const existingTint = tile.querySelector<HTMLElement>('.tile-tint');
      activeTile._prevTint = existingTint?.style.background ?? '';

      const tr = tile.getBoundingClientRect();
      const cx = tr.left + tr.width  / 2;
      const cy = tr.top  + tr.height / 2;

      activeTile._boardParent = tile.parentNode!;
      activeTile._boardLeft   = tile.style.left;
      activeTile._boardTop    = tile.style.top;
      tile.style.position = 'fixed';
      tile.style.left     = tr.left + 'px';
      tile.style.top      = tr.top  + 'px';
      tile.style.zIndex   = '10001';
      document.body.appendChild(tile);

      buildPie();
      const size = (R_OUTER + PAD) * 2;
      pieMenu.style.left = cx - size / 2 + 'px';
      pieMenu.style.top  = cy - size / 2 + 'px';
      pieCenter.x = cx;
      pieCenter.y = cy;
      hoveredIdx = -1;
      pieMenu.classList.add('visible');

      document.addEventListener('pointermove', onPieMove);
      document.addEventListener('pointerup',   onPieUp);
    };

  void getTopZ; // used via bumpTopZ closure
}
