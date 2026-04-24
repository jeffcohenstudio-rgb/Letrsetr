import './style.css';
import { History } from './history';
import { pointInPoly, buildPathD } from './lasso';
import { separateTiles } from './separation';
import { applyTheme, getTileFilter } from './theme';
import { storage } from './storage';
import { initPieMenu } from './pie';
import type { Point } from './types';

const board     = document.getElementById('board')!;
const input     = document.getElementById('letterInput') as HTMLInputElement;
const addBtn    = document.getElementById('addBtn')!;
const clearBtn  = document.getElementById('clearBtn')!;
const hint      = document.getElementById('hint')!;
const hole      = document.getElementById('hole')!;
const tileCount = document.getElementById('tileCount')!;
const lassoSvg  = document.getElementById('lasso-svg')!;
const lassoPath = document.getElementById('lasso-path')!;

let tiles: HTMLElement[] = [];
let selected: HTMLElement[] = [];
let dragging: HTMLElement | null = null;
let dragOffX = 0, dragOffY = 0;
let topZ = 20;
let tileSize = 60;

const history = new History(20);

function snapshotForUndo(): void {
  history.push(tiles.map(t => ({
    letter: t.querySelector('.tile-letter')!.textContent ?? '',
    left:   t.style.left,
    top:    t.style.top,
    rot:    parseFloat(t.dataset['baseRot'] ?? '0'),
  })));
}

function applyUndo(): void {
  const snap = history.pop();
  if (!snap) return;
  clearSelection();
  tiles.forEach(t => t.remove());
  tiles = [];
  snap.forEach(s => {
    makeTile(s.letter || '_', parseFloat(s.left), parseFloat(s.top));
    const t = tiles[tiles.length - 1];
    t.dataset['baseRot'] = String(s.rot);
    t.style.transform = `rotate(${s.rot}deg)`;
  });
  updateHint();
}

let snapEnabled = false;

function updateHint(): void {
  hint.style.display = tiles.length === 0 ? 'flex' : 'none';
  tileCount.textContent = String(tiles.length);
}

function clearSelection(): void {
  selected.forEach(t => t.classList.remove('selected'));
  selected = [];
}

function tileCentreInPoly(el: HTMLElement, poly: Point[]): boolean {
  const cx = parseFloat(el.style.left) + tileSize / 2;
  const cy = parseFloat(el.style.top)  + tileSize / 2;
  return pointInPoly(cx, cy, poly);
}

// ── Lasso ──
let lassoing    = false;
let lassoPoints: Point[] = [];
let lassoEnabled = true;

board.addEventListener('pointerdown', e => {
  if (e.target !== board && e.target !== lassoSvg &&
      e.target !== lassoPath && e.target !== hint &&
      !(e.target as Element).closest?.('#hint') && e.target !== hole) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (!lassoEnabled) return;
  clearSelection();
  lassoing = true;
  lassoPoints = [];
  const br = board.getBoundingClientRect();
  lassoPoints.push([e.clientX - br.left, e.clientY - br.top]);
  lassoPath.setAttribute('d', '');
  board.setPointerCapture(e.pointerId);
  e.preventDefault();
});

board.addEventListener('pointermove', e => {
  if (!lassoing) return;
  const br = board.getBoundingClientRect();
  lassoPoints.push([e.clientX - br.left, e.clientY - br.top]);
  if (lassoPoints.length > 3) lassoPath.setAttribute('d', buildPathD(lassoPoints));
  e.preventDefault();
});

board.addEventListener('pointerup', () => {
  if (!lassoing) return;
  lassoing = false;
  lassoPath.setAttribute('d', '');
  if (lassoPoints.length < 6) return;
  clearSelection();
  tiles.forEach(t => {
    if (tileCentreInPoly(t, lassoPoints)) {
      t.classList.add('selected');
      selected.push(t);
    }
  });
  lassoPoints = [];
});

// ── Hole ──
function tileOverHole(el: HTMLElement): boolean {
  const tr = el.getBoundingClientRect();
  const hr = hole.getBoundingClientRect();
  const tileCX = tr.left + tr.width  / 2;
  const tileCY = tr.top  + tr.height / 2;
  const holeCX = hr.left + hr.width  / 2;
  const holeCY = hr.top  + hr.height / 2;
  const dx = (tileCX - holeCX) / (hr.width  * 0.6);
  const dy = (tileCY - holeCY) / (hr.height * 0.6);
  return dx * dx + dy * dy < 1;
}

function dropIntoHole(el: HTMLElement): void {
  const br = board.getBoundingClientRect();
  const hr = hole.getBoundingClientRect();
  const holeCX = hr.left + hr.width  / 2 - br.left;
  const holeCY = hr.top  + hr.height / 2 - br.top;
  el.style.left = holeCX - tileSize / 2 + 'px';
  el.style.top  = holeCY - tileSize / 2 + 'px';
  el.style.transform  = 'rotate(0deg)';
  el.style.transition = 'none';
  el.classList.remove('dragging', 'selected');
  el.classList.add('falling');
  el.style.zIndex = '9998';
  el.addEventListener('animationend', () => {
    el.remove();
    tiles    = tiles.filter(t => t !== el);
    selected = selected.filter(t => t !== el);
    updateHint();
  }, { once: true });
}

// ── Color / theme state ──
let currentTileHR  = 0;
let currentTileBR  = 1.0;
let currentTileSat = 1.0;

const savedFilter = storage.getTileFilter();
if (savedFilter) { currentTileHR = savedFilter.hr; currentTileBR = savedFilter.br; currentTileSat = savedFilter.sat; }

let currentH = 150, currentL = 18, currentS = 44;
const savedTheme = storage.getTheme();
if (savedTheme) { currentH = savedTheme.h; currentL = savedTheme.l; currentS = savedTheme.s; }

function applyTileFilter(hr: number, br: number, sat: number): void {
  currentTileHR = hr; currentTileBR = br; currentTileSat = sat;
  storage.setTileFilter(hr, br, sat);
  const f = getTileFilter(hr, br, sat);
  tiles.forEach(t => { (t.querySelector('.tile-inner') as HTMLElement).style.filter = f; });
}

function doApplyTheme(h: number, l: number, s = currentS): void {
  currentH = h; currentL = l; currentS = s;
  storage.setTheme(h, l, s);
  applyTheme(h, l, s);
}

// ── Make tile ──
function makeTile(letter: string, x: number, y: number): void {
  const upper   = letter.toUpperCase();
  const isBlank = upper === ' ' || letter === '_';

  const el = document.createElement('div');
  el.className    = 'tile';
  el.style.width  = tileSize + 'px';
  el.style.height = tileSize + 'px';
  el.style.left   = x + 'px';
  el.style.top    = y + 'px';

  const inner = document.createElement('div');
  inner.className = 'tile-inner';
  inner.style.filter = getTileFilter(currentTileHR, currentTileBR, currentTileSat);

  const tintDiv = document.createElement('div');
  tintDiv.className = 'tile-tint';
  inner.appendChild(tintDiv);

  const span = document.createElement('span');
  span.className      = 'tile-letter';
  span.style.fontSize = tileSize * 0.55 + 'px';
  span.textContent    = isBlank ? '' : upper;

  inner.appendChild(span);
  el.appendChild(inner);

  const rot = (Math.random() - 0.5) * 7;
  el.style.transform  = `rotate(${rot}deg)`;
  el.dataset['baseRot'] = String(rot);
  el.style.transition = 'box-shadow 0.12s';

  let groupStartPositions: { tile: HTMLElement; x: number; y: number }[] = [];
  const elWithStart = el as HTMLElement & { _leadStart?: { x: number; y: number } };

  // Long-press → pie menu
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pointerId = e.pointerId;
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      dragging = null;
      el.classList.remove('dragging');
      el.style.transform = `rotate(${rot}deg)`;
      el.style.boxShadow = '';
      try { el.releasePointerCapture(pointerId); } catch { /* ignore */ }
      (window as Window & { showPieMenu?: (t: HTMLElement, cx: number, cy: number) => void }).showPieMenu?.(el, e.clientX, e.clientY);
    }, 500);
  });
  const clearLongPress = (): void => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };
  el.addEventListener('pointerup',     clearLongPress);
  el.addEventListener('pointermove',   clearLongPress);
  el.addEventListener('pointercancel', clearLongPress);

  el.addEventListener('touchstart',  e => e.preventDefault(), { passive: false });
  el.addEventListener('contextmenu', e => e.preventDefault());

  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    input.blur();

    if (!el.classList.contains('selected')) clearSelection();

    dragging = el;
    snapshotForUndo();
    el.style.zIndex = String(++topZ);

    const r = el.getBoundingClientRect();
    dragOffX = e.clientX - r.left;
    dragOffY = e.clientY - r.top;

    el.classList.add('dragging');
    el.style.transform = `rotate(${rot + 3}deg) scale(1.08)`;
    el.style.boxShadow = '0 18px 40px rgba(0,0,0,0.6)';

    groupStartPositions = selected.map(t => ({ tile: t, x: parseFloat(t.style.left), y: parseFloat(t.style.top) }));
    elWithStart._leadStart = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };

    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', e => {
    if (dragging !== el) return;
    e.preventDefault();
    const br = board.getBoundingClientRect();
    const nx = Math.max(0, Math.min(br.width  - tileSize - 4, e.clientX - br.left - dragOffX));
    const ny = Math.max(0, Math.min(br.height - tileSize - 4, e.clientY - br.top  - dragOffY));
    const dx = nx - (elWithStart._leadStart?.x ?? 0);
    const dy = ny - (elWithStart._leadStart?.y ?? 0);
    el.style.left = nx + 'px';
    el.style.top  = ny + 'px';
    groupStartPositions.forEach(rec => {
      if (rec.tile === el) return;
      rec.tile.style.left = Math.max(0, Math.min(br.width  - tileSize - 4, rec.x + dx)) + 'px';
      rec.tile.style.top  = Math.max(0, Math.min(br.height - tileSize - 4, rec.y + dy)) + 'px';
    });
    hole.classList.toggle('active', tileOverHole(el));
  });

  function endDrag(): void {
    if (dragging !== el) return;
    dragging = null;
    hole.classList.remove('active');
    if (tileOverHole(el)) {
      const toDiscard = selected.length > 0 ? selected.slice() : [el];
      clearSelection();
      toDiscard.forEach(t => dropIntoHole(t));
      return;
    }
    el.classList.remove('dragging');
    el.style.transform = `rotate(${rot}deg)`;
    el.style.boxShadow = '';
    doSeparate(tileSize);
  }

  el.addEventListener('pointerup',     endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('dblclick', e => e.preventDefault());

  board.appendChild(el);
  tiles.push(el);
  updateHint();
}

function doSeparate(sz: number, w?: number, h?: number): boolean {
  const br = board.getBoundingClientRect();
  return separateTiles(tiles, sz, w ?? br.width, h ?? br.height, snapEnabled);
}

// ── Add tiles ──
function addTiles(): void {
  const text = input.value;
  if (!text?.trim()) return;
  snapshotForUndo();

  const br     = board.getBoundingClientRect();
  const boardW = br.width  || 360;
  const boardH = br.height || 480;
  const tileW  = tileSize + 8, tileH = tileSize + 8, pad = 14;
  const cols   = Math.max(1, Math.floor((boardW - pad * 2) / tileW));

  const chars = Array.from(text).filter(c => c !== '\n');
  const totalRows = Math.ceil(chars.length / cols);
  const startY    = Math.max(pad, Math.round((boardH - totalRows * tileH) / 2));

  chars.forEach((ch, j) => {
    const row = Math.floor(j / cols);
    const col = j % cols;
    let x = pad + col * tileW + (Math.random() - 0.5) * 4;
    let y = startY + row * tileH + (Math.random() - 0.5) * 4;
    x = Math.min(x, boardW - tileSize - pad);
    y = Math.min(y, boardH - tileSize - pad);
    makeTile(ch, x, y);
  });
  input.value = '';
  doSeparate(tileSize);
}

function onAdd(e: Event): void { e.preventDefault(); e.stopPropagation(); addTiles(); }
addBtn.addEventListener('pointerdown', onAdd);
addBtn.addEventListener('click',       onAdd);
input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTiles(); } });

function onClear(e: Event): void {
  e.preventDefault(); e.stopPropagation();
  snapshotForUndo();
  clearSelection();
  tiles.forEach(t => t.remove());
  tiles = [];
  updateHint();
}
clearBtn.addEventListener('pointerdown', onClear);
clearBtn.addEventListener('click',       onClear);

// ── Size slider ──
const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
sizeSlider.addEventListener('input', function () {
  const newVal = parseInt(this.value);

  if (newVal < tileSize) {
    const ratio = newVal / tileSize;
    const br    = board.getBoundingClientRect();
    const cx = br.width / 2, cy = br.height / 2;
    tiles.forEach(t => {
      t.style.left = cx + (parseFloat(t.style.left) - cx) * ratio + 'px';
      t.style.top  = cy + (parseFloat(t.style.top)  - cy) * ratio + 'px';
      t.style.width  = newVal + 'px';
      t.style.height = newVal + 'px';
      t.querySelector<HTMLElement>('.tile-letter')!.style.fontSize = newVal * 0.55 + 'px';
    });
    tileSize = newVal;
  } else if (newVal > tileSize) {
    const br2  = board.getBoundingClientRect();
    const saved = tiles.map(t => ({ left: t.style.left, top: t.style.top }));
    tiles.forEach(t => {
      t.style.width  = newVal + 'px';
      t.style.height = newVal + 'px';
      t.querySelector<HTMLElement>('.tile-letter')!.style.fontSize = newVal * 0.55 + 'px';
    });
    if (!separateTiles(tiles, newVal, br2.width, br2.height, snapEnabled)) {
      tiles.forEach((t, idx) => {
        t.style.left   = saved[idx].left;
        t.style.top    = saved[idx].top;
        t.style.width  = tileSize + 'px';
        t.style.height = tileSize + 'px';
        t.querySelector<HTMLElement>('.tile-letter')!.style.fontSize = tileSize * 0.55 + 'px';
      });
      this.value = String(tileSize);
      return;
    }
    tileSize = newVal;
  }
});

// ── Snap toggle ──
const snapToggle = document.getElementById('snapToggle') as HTMLInputElement;
snapToggle.addEventListener('change', function () {
  snapEnabled = this.checked;
  if (snapEnabled) {
    const grid = tileSize + 4;
    tiles.forEach(t => {
      t.style.left = Math.round(parseFloat(t.style.left) / grid) * grid + 'px';
      t.style.top  = Math.round(parseFloat(t.style.top)  / grid) * grid + 'px';
    });
    doSeparate(tileSize);
  }
});

// ── Lasso toggle ──
const lassoToggle = document.getElementById('lassoToggle') as HTMLInputElement;
lassoToggle.addEventListener('change', function () {
  lassoEnabled = this.checked;
  (lassoSvg as HTMLElement).style.display = lassoEnabled ? '' : 'none';
});

// ── Save / Restore ──
document.getElementById('saveBtn')!.addEventListener('click', function (e) {
  e.stopPropagation();
  storage.setLayout({
    size: tileSize,
    tiles: tiles.map(t => ({
      letter: t.querySelector('.tile-letter')!.textContent || '_',
      left:   t.style.left,
      top:    t.style.top,
      rot:    parseFloat(t.dataset['baseRot'] ?? '0'),
    })),
  });
  this.textContent = 'Saved ✓';
  const btn = this;
  setTimeout(() => { btn.textContent = 'Save Layout'; }, 1500);
});

document.getElementById('restoreBtn')!.addEventListener('click', e => {
  e.stopPropagation();
  const data = storage.getLayout();
  if (!data) return;
  snapshotForUndo();
  clearSelection();
  tiles.forEach(t => t.remove());
  tiles = [];
  tileSize = data.size || tileSize;
  sizeSlider.value = String(tileSize);
  data.tiles.forEach(s => {
    makeTile(s.letter || '_', parseFloat(s.left), parseFloat(s.top));
    const t = tiles[tiles.length - 1];
    t.dataset['baseRot'] = String(s.rot);
    t.style.transform = `rotate(${s.rot}deg)`;
  });
  updateHint();
});

document.getElementById('undoBtn')!.addEventListener('click', e => { e.stopPropagation(); applyUndo(); });
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); applyUndo(); }
});

// ── 2D Color pad ──
(function () {
  const pad    = document.getElementById('colorPad')!;
  const thumb  = document.getElementById('colorPadThumb') as HTMLElement;
  const L_TOP = 65, L_BOT = 5;
  const BR_TOP = 1.6, BR_BOT = 0.3;
  let isDragging = false;
  let colorTarget: 'bg' | 'tiles' = 'bg';

  function posFromHL(h: number, l: number): { x: number; y: number } {
    const w = pad.offsetWidth, ph = pad.offsetHeight;
    return { x: Math.max(0, Math.min(w, (h / 360) * w)), y: Math.max(0, Math.min(ph, ((L_TOP - l) / (L_TOP - L_BOT)) * ph)) };
  }
  function posFromTile(hr: number, br: number): { x: number; y: number } {
    const w = pad.offsetWidth, ph = pad.offsetHeight;
    return { x: Math.max(0, Math.min(w, (hr / 360) * w)), y: Math.max(0, Math.min(ph, ((BR_TOP - br) / (BR_TOP - BR_BOT)) * ph)) };
  }

  function syncThumb(): void {
    const p = colorTarget === 'tiles' ? posFromTile(currentTileHR, currentTileBR) : posFromHL(currentH, currentL);
    thumb.style.left = p.x + 'px';
    thumb.style.top  = p.y + 'px';
  }
  (window as Window & { updatePadThumb?: () => void }).updatePadThumb = syncThumb;

  function onPadMove(e: PointerEvent): void {
    if (!isDragging) return;
    const r  = pad.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const tx = Math.max(0, Math.min(pad.offsetWidth,  cx));
    const ty = Math.max(0, Math.min(pad.offsetHeight, cy));
    thumb.style.left = tx + 'px';
    thumb.style.top  = ty + 'px';

    if (colorTarget === 'tiles') {
      const hr = Math.round((cx / pad.offsetWidth) * 360);
      const br = parseFloat((BR_TOP - (cy / pad.offsetHeight) * (BR_TOP - BR_BOT)).toFixed(2));
      applyTileFilter(hr, br, currentTileSat);
    } else {
      const h = Math.round((cx / pad.offsetWidth) * 360);
      const l = Math.round(L_TOP - (cy / pad.offsetHeight) * (L_TOP - L_BOT));
      doApplyTheme(h, l);
    }
    e.stopPropagation();
  }

  pad.addEventListener('pointerdown', e => { isDragging = true; pad.setPointerCapture(e.pointerId); onPadMove(e); e.stopPropagation(); });
  pad.addEventListener('pointermove', e => onPadMove(e));
  pad.addEventListener('pointerup',   e => { isDragging = false; e.stopPropagation(); });

  // ── Saturation slider ──
  const satSlider = document.getElementById('saturationSlider') as HTMLInputElement;
  const satVal    = document.getElementById('saturationVal')!;

  function syncSat(): void {
    if (colorTarget === 'tiles') {
      satSlider.value = String(Math.round(currentTileSat * 50));
      satVal.textContent = Math.round(currentTileSat * 100) + '%';
    } else {
      satSlider.value = String(currentS);
      satVal.textContent = currentS + '%';
    }
    satSlider.style.accentColor = `hsl(${currentH},65%,68%)`;
  }
  (window as Window & { syncSaturationSlider?: () => void }).syncSaturationSlider = syncSat;

  satSlider.addEventListener('input', function () {
    if (colorTarget === 'tiles') {
      const sat = parseFloat((parseInt(this.value) / 50).toFixed(2));
      applyTileFilter(currentTileHR, currentTileBR, sat);
      satVal.textContent = Math.round(sat * 100) + '%';
    } else {
      doApplyTheme(currentH, currentL, parseInt(this.value));
      satVal.textContent = this.value + '%';
    }
  });

  // ── Color target buttons ──
  const targetBgBtn    = document.getElementById('targetBg')!;
  const targetTilesBtn = document.getElementById('targetTiles')!;

  function setColorTarget(t: 'bg' | 'tiles'): void {
    colorTarget = t;
    const active   = 'background:var(--accent-faint);color:var(--accent);border-color:var(--accent-border);';
    const inactive = 'background:transparent;color:rgba(255,255,255,0.35);border-color:rgba(255,255,255,0.15);';
    targetBgBtn.style.cssText    += t === 'bg'    ? active : inactive;
    targetTilesBtn.style.cssText += t === 'tiles' ? active : inactive;
    syncSat();
    setTimeout(syncThumb, 10);
  }

  targetBgBtn.addEventListener('click',    e => { e.stopPropagation(); setColorTarget('bg'); });
  targetTilesBtn.addEventListener('click', e => { e.stopPropagation(); setColorTarget('tiles'); });

  // ── Gear dropdown ──
  const gearBtn       = document.getElementById('gearBtn')!;
  const settingsPanel = document.getElementById('settingsPanel') as HTMLElement;

  gearBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = settingsPanel.style.display === 'block';
    settingsPanel.style.display = open ? 'none' : 'block';
    if (!open) { syncSat(); setTimeout(syncThumb, 10); }
  });
  document.addEventListener('click', () => { settingsPanel.style.display = 'none'; });
  settingsPanel.addEventListener('click', e => e.stopPropagation());

  doApplyTheme(currentH, currentL, currentS);
  applyTileFilter(currentTileHR, currentTileBR, currentTileSat);
  syncSat();
}());

// ── Top bar tab ──
(function () {
  const topBar = document.getElementById('top-bar')!;
  document.getElementById('top-bar-tab')!.addEventListener('pointerdown', e => {
    e.stopPropagation();
    topBar.classList.toggle('hidden');
  });
}());

// ── Pie menu ──
initPieMenu(() => topZ, () => ++topZ);

// ── Global guards ──
document.addEventListener('dblclick',    e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', e => e.preventDefault());

updateHint();
